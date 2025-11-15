// Telegram bot for worker communication
import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const TELEGRAM_ENABLED = !!process.env.TELEGRAM_BOT_TOKEN;

const bot = TELEGRAM_ENABLED
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true })
  : null;

interface PendingTaskAcceptance {
  taskId: string;
  workerId: string;
  expiresAt: number;
}

const pendingAcceptances = new Map<string, PendingTaskAcceptance>();

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

      await bot.sendMessage(
        chatId,
        `✅ Registration successful!\n\n` +
          `Username: @${username}\n` +
          `Skills: ${skills.join(", ")}\n` +
          `Worker ID: ${worker.id}\n\n` +
          `You'll receive task notifications here. Link your Stripe account with /linkstripe to receive payments.`
      );
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
        "2. Contact the admin with your Worker ID to link your account\n\n" +
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
              `Submit evidence by:\n` +
              `1. Sending photos of completed work\n` +
              `2. Sharing your location\n\n` +
              `Reply to this message with your evidence.`
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
    console.log("Photo received from worker");
  });

  bot.on("location", async (msg) => {
    console.log("Location received from worker");
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
