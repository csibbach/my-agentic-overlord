// Telegram bot for worker communication
import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import axios from "axios";
import sharp from "sharp";
import { createWorkerStripeAccount, isStripeEnabled } from "./stripeService";

const TELEGRAM_ENABLED = !!process.env.TELEGRAM_BOT_TOKEN;

const bot = TELEGRAM_ENABLED
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true })
  : null;

interface PendingTaskAcceptance {
  taskId: string;
  workerId: string;
  expiresAt: number;
}

interface EvidenceSubmission {
  workerId: string;
  taskId: string;
  photoBase64Images: string[];
  latitude: string | null;
  longitude: string | null;
}

const pendingAcceptances = new Map<string, PendingTaskAcceptance>();
const pendingEvidence = new Map<string, EvidenceSubmission>(); // Key: chatId

export function initializeTelegramBot() {
  if (!TELEGRAM_ENABLED || !bot) {
    console.log("Telegram bot disabled (no TELEGRAM_BOT_TOKEN)");
    return;
  }
  
  console.log("Telegram bot initialized");

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      "Welcome to TaskRoute! 🚀\n\n" +
        "Register as a worker: /register @username skill1,skill2,skill3\n" +
        "Example: /register @johndoe photography,delivery,verification"
    );
  });

  bot.onText(/\/register (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!match || !match[1]) {
      await bot.sendMessage(chatId, "Usage: /register @username skill1,skill2,skill3");
      return;
    }

    const parts = match[1].trim().split(/\s+/);
    if (parts.length < 2) {
      await bot.sendMessage(chatId, "Usage: /register @username skill1,skill2,skill3");
      return;
    }

    const username = parts[0].replace("@", "");
    const skillsStr = parts.slice(1).join(" ");
    const skills = skillsStr.split(",").map((s) => s.trim());

    try {
      const worker = await storage.createWorker({
        telegramUsername: username,
        telegramChatId: chatId.toString(),
        skills,
        availability: "available",
      });

      let registrationMessage = `✅ Registration successful!\n\n` +
        `Username: @${username}\n` +
        `Skills: ${skills.join(", ")}\n` +
        `Worker ID: ${worker.id}\n\n`;

      if (isStripeEnabled()) {
        await bot.sendMessage(chatId, registrationMessage + `⏳ Setting up your payment account...`);
        
        try {
          const stripeResult = await createWorkerStripeAccount(worker.id, username);
          
          if (stripeResult) {
            await storage.updateWorkerStripeAccount(worker.id, stripeResult.accountId);
            
            await bot.sendMessage(
              chatId,
              `💳 Payment Account Setup\n\n` +
                `To receive payments, you need to complete your Stripe account setup.\n\n` +
                `Click here to get started:\n${stripeResult.onboardingUrl}\n\n` +
                `⚠️ This link expires in a few minutes. If it expires, contact the oligarch.\n\n` +
                `After completing setup, you'll be able to receive payments for completed tasks!`
            );
          } else {
            await bot.sendMessage(
              chatId,
              `You're registered! You'll receive task notifications here.`
            );
          }
        } catch (stripeError) {
          console.error("Error creating Stripe account:", stripeError);
          await bot.sendMessage(
            chatId,
            `⚠️ Payment account setup failed. Contact the oligarch to set up payments.\n\n` +
              `You can still accept and complete tasks, but payments will need manual processing.`
          );
        }
      } else {
        registrationMessage += `You'll receive task notifications here. (Stripe payments not configured)`;
        await bot.sendMessage(chatId, registrationMessage);
      }
    } catch (error) {
      console.error("Error registering worker:", error);
      await bot.sendMessage(
        chatId,
        `❌ Registration failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });

  bot.onText(/\/linkstripe/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      "🔗 To link your Stripe account:\n\n" +
        "1. Create a Stripe Express account at https://stripe.com\n" +
        "2. Contact the oligarch with your Worker ID to link your account\n\n" +
        "This will allow you to receive payments for completed tasks."
    );
  });

  bot.on("callback_query", async (query) => {
    if (!query.data || !query.message) return;

    const [action, taskId] = query.data.split(":");
    const chatId = query.message.chat.id;

    if (action === "accept") {
      const pending = pendingAcceptances.get(`${chatId}:${taskId}`);
      if (!pending) {
        await bot.answerCallbackQuery(query.id, {
          text: "❌ This task is no longer available",
        });
        return;
      }

      if (Date.now() > pending.expiresAt) {
        pendingAcceptances.delete(`${chatId}:${taskId}`);
        await bot.answerCallbackQuery(query.id, {
          text: "❌ This task has expired",
        });
        return;
      }

      try {
        const result = await storage.acceptTask(taskId, pending.workerId);
        
        if (result.success) {
          pendingAcceptances.delete(`${chatId}:${taskId}`);
          await bot.answerCallbackQuery(query.id, {
            text: "✅ Task accepted! You can start working on it.",
          });
          await bot.sendMessage(
            chatId,
            `🎉 You've been assigned the task!\n\n` +
              `📸 To submit evidence:\n` +
              `1. Send photos of completed work\n` +
              `2. (Optional) Share your location\n` +
              `3. Use /submit when ready\n\n` +
              `The AI will verify your work and process payment automatically.`
          );
        } else {
          await bot.answerCallbackQuery(query.id, {
            text: "❌ Task already taken by another worker",
          });
        }
      } catch (error) {
        console.error("Error accepting task:", error);
        await bot.answerCallbackQuery(query.id, {
          text: "❌ Error accepting task",
        });
      }
    } else if (action === "reject") {
      pendingAcceptances.delete(`${chatId}:${taskId}`);
      await bot.answerCallbackQuery(query.id, {
        text: "Task declined",
      });
    }
  });

  bot.on("photo", async (msg) => {
    const chatId = msg.chat.id;
    console.log(`Photo received from worker (chat: ${chatId})`);
    
    try {
      // Find worker by chat ID
      const workers = await storage.getAllWorkers();
      const worker = workers.find(w => w.telegramChatId === chatId.toString());
      
      if (!worker) {
        await bot.sendMessage(chatId, "❌ You must register first. Use /register @username skills");
        return;
      }

      // Find active task for this worker
      const tasks = await storage.getAllTasks();
      const activeTask = tasks.find(t => 
        t.assignedWorkerId === worker.id && 
        (t.status === "assigned" || t.status === "in_progress")
      );

      if (!activeTask) {
        await bot.sendMessage(chatId, "❌ No active task found. Accept a task first.");
        return;
      }

      // Get the largest photo size (highest resolution)
      const photo = msg.photo![msg.photo!.length - 1];
      const fileId = photo.file_id;

      // Download photo from Telegram
      const file = await bot.getFile(fileId);
      const filePath = file.file_path;
      
      if (!filePath) {
        await bot.sendMessage(chatId, "❌ Failed to download photo. Please try again.");
        return;
      }

      // Download the photo
      const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
      const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      
      // Process image: resize to max 1568px and compress to JPEG 85% quality
      // This optimizes for Anthropic's API requirements while maintaining good quality
      const processedImage = await sharp(Buffer.from(response.data))
        .resize(1568, 1568, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      const base64Image = processedImage.toString('base64');

      // Check if existing evidence is for a different task - if so, reset it
      const existingEvidence = pendingEvidence.get(chatId.toString());
      if (existingEvidence && existingEvidence.taskId !== activeTask.id) {
        console.log(`Worker ${worker.id} started new task ${activeTask.id}, clearing old evidence for task ${existingEvidence.taskId}`);
        await bot.sendMessage(
          chatId,
          `⚠️ You have a new active task. Previous evidence cleared.\n\n` +
            `Starting fresh evidence collection for current task.`
        );
        pendingEvidence.delete(chatId.toString());
      }

      // Initialize or update evidence submission
      const currentEvidence = pendingEvidence.get(chatId.toString());
      if (currentEvidence) {
        currentEvidence.photoBase64Images.push(base64Image);
      } else {
        pendingEvidence.set(chatId.toString(), {
          workerId: worker.id,
          taskId: activeTask.id,
          photoBase64Images: [base64Image],
          latitude: null,
          longitude: null,
        });
      }

      await bot.sendMessage(
        chatId,
        `✅ Photo received! (${pendingEvidence.get(chatId.toString())!.photoBase64Images.length} total)\n\n` +
          `Send more photos, share your location, or use /submit to complete the task.`
      );

    } catch (error) {
      console.error("Error processing photo:", error);
      await bot.sendMessage(chatId, "❌ Error processing photo. Please try again.");
    }
  });

  bot.on("location", async (msg) => {
    const chatId = msg.chat.id;
    console.log(`Location received from worker (chat: ${chatId})`);
    
    try {
      // Find worker by chat ID
      const workers = await storage.getAllWorkers();
      const worker = workers.find(w => w.telegramChatId === chatId.toString());
      
      if (!worker) {
        await bot.sendMessage(chatId, "❌ You must register first. Use /register @username skills");
        return;
      }

      // Find active task for this worker
      const tasks = await storage.getAllTasks();
      const activeTask = tasks.find(t => 
        t.assignedWorkerId === worker.id && 
        (t.status === "assigned" || t.status === "in_progress")
      );

      if (!activeTask) {
        await bot.sendMessage(chatId, "❌ No active task found. Accept a task first.");
        return;
      }

      const latitude = msg.location!.latitude.toString();
      const longitude = msg.location!.longitude.toString();

      // Check if existing evidence is for a different task - if so, reset it
      const existingEvidence = pendingEvidence.get(chatId.toString());
      if (existingEvidence && existingEvidence.taskId !== activeTask.id) {
        console.log(`Worker ${worker.id} started new task ${activeTask.id}, clearing old evidence for task ${existingEvidence.taskId}`);
        await bot.sendMessage(
          chatId,
          `⚠️ You have a new active task. Previous evidence cleared.\n\n` +
            `Location saved for current task.`
        );
        pendingEvidence.delete(chatId.toString());
      }

      // Initialize or update evidence submission with location
      const currentEvidence = pendingEvidence.get(chatId.toString());
      if (currentEvidence) {
        currentEvidence.latitude = latitude;
        currentEvidence.longitude = longitude;
      } else {
        pendingEvidence.set(chatId.toString(), {
          workerId: worker.id,
          taskId: activeTask.id,
          photoBase64Images: [],
          latitude: latitude,
          longitude: longitude,
        });
      }

      console.log(`Location saved for worker task ${activeTask.id}: ${latitude}, ${longitude}`);

      await bot.sendMessage(
        chatId,
        `📍 Location received!\n\n` +
          `Latitude: ${latitude}\n` +
          `Longitude: ${longitude}\n\n` +
          `Send photos and use /submit when ready.`
      );

    } catch (error) {
      console.error("Error processing location:", error);
      await bot.sendMessage(chatId, "❌ Error processing location. Please try again.");
    }
  });

  bot.onText(/\/submit/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const evidence = pendingEvidence.get(chatId.toString());
      
      if (!evidence || evidence.photoBase64Images.length === 0) {
        await bot.sendMessage(
          chatId,
          "❌ No photos to submit. Send photos first, then use /submit."
        );
        return;
      }

      await bot.sendMessage(chatId, "⏳ Submitting evidence for AI verification...");

      // Submit evidence to the API
      const apiUrl = `http://localhost:5000/api/tasks/${evidence.taskId}/evidence`;
      const response = await axios.post(apiUrl, {
        workerId: evidence.workerId,
        photoBase64Images: evidence.photoBase64Images,
        latitude: evidence.latitude,
        longitude: evidence.longitude,
      });

      // Clear pending evidence
      pendingEvidence.delete(chatId.toString());

      const verification = response.data.verification;
      
      if (verification.decision === "approved") {
        await bot.sendMessage(
          chatId,
          `✅ Task Approved!\n\n` +
            `${verification.reasoning}\n\n` +
            `💰 Payment is being processed to your Stripe account.`
        );
      } else if (verification.decision === "rejected") {
        await bot.sendMessage(
          chatId,
          `❌ Task Rejected\n\n` +
            `${verification.reasoning}\n\n` +
            `Please review the requirements and try again.`
        );
      } else {
        await bot.sendMessage(
          chatId,
          `⚠️ Manual Review Required\n\n` +
            `${verification.reasoning}\n\n` +
            `An oligarch will review your submission shortly.`
        );
      }

    } catch (error) {
      console.error("Error submitting evidence:", error);
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Unknown error occurred";
        
      await bot.sendMessage(
        chatId,
        `❌ Submission failed: ${errorMessage}\n\nPlease try again or contact support.`
      );
    }
  });
}

export async function notifyWorkersAboutTask(
  workerIds: string[],
  taskId: string,
  taskDescription: string,
  paymentAmount: string
) {
  if (!TELEGRAM_ENABLED || !bot) {
    console.log("Telegram notifications disabled - workers not notified");
    return;
  }
  
  const workers = await storage.getWorkersByIds(workerIds);

  for (const worker of workers) {
    if (!worker.telegramChatId) continue;

    const chatId = parseInt(worker.telegramChatId);
    const expiresAt = Date.now() + 15 * 60 * 1000;

    pendingAcceptances.set(`${chatId}:${taskId}`, {
      taskId,
      workerId: worker.id,
      expiresAt,
    });

    await storage.createTaskAssignment({
      taskId,
      workerId: worker.id,
      status: "notified",
    });

    try {
      await bot.sendMessage(
        chatId,
        `🔔 New Task Available!\n\n` +
          `💰 Payment: $${paymentAmount}\n` +
          `📝 Description: ${taskDescription}\n\n` +
          `⏰ Accept within 15 minutes to claim this task.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Accept Task", callback_data: `accept:${taskId}` },
                { text: "❌ Decline", callback_data: `reject:${taskId}` },
              ],
            ],
          },
        }
      );
    } catch (error) {
      console.error(`Error notifying worker ${worker.id}:`, error);
    }
  }
}

export async function notifyWorkerPaymentComplete(
  workerId: string,
  taskId: string,
  amount: string
) {
  if (!TELEGRAM_ENABLED || !bot) {
    return;
  }
  
  const worker = await storage.getWorker(workerId);
  if (!worker || !worker.telegramChatId) return;

  const chatId = parseInt(worker.telegramChatId);

  try {
    await bot.sendMessage(
      chatId,
      `💰 Payment Received!\n\n` +
        `Task: ${taskId.slice(0, 8)}\n` +
        `Amount: $${amount}\n\n` +
        `The payment has been sent to your linked Stripe account. Great work! 🎉`
    );
  } catch (error) {
    console.error(`Error notifying worker about payment:`, error);
  }
}

let cachedBotUsername: string | null = null;

export function getBotUsername(): string | null {
  if (!TELEGRAM_ENABLED || !bot) {
    return null;
  }
  
  if (cachedBotUsername) {
    return cachedBotUsername;
  }
  
  bot.getMe().then(info => {
    cachedBotUsername = info.username || null;
  }).catch(err => {
    console.error("Error getting bot info:", err);
  });
  
  return cachedBotUsername;
}

export { bot };
