import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { initializeTelegramBot, notifyWorkersAboutTask, notifyWorkerPaymentComplete, getBotUsername } from "./telegramBot";
import { initializeVectorIndex, addWorkerToVectorDB, findMatchingWorkers } from "./vectorService";
import { verifyTaskEvidence } from "./anthropicService";
import { payWorker, isStripeEnabled as checkStripeEnabled } from "./stripeService";
import { insertTaskSchema, insertWorkerSchema } from "@shared/schema";
import express from "express";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";

const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;
const X402_ENABLED = !!process.env.CDP_API_KEY_ID && !!process.env.CDP_API_KEY_SECRET;

const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!STRIPE_ENABLED || !stripe) {
      return res.status(400).json({ message: "Stripe not configured" });
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).json({ message: "No signature" });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ""
      );

      if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        console.log(`Stripe account updated: ${account.id}, charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}`);
        
        try {
          await storage.updateWorkerStripeOnboarding(
            account.id,
            account.charges_enabled || false,
            account.payouts_enabled || false
          );
          
          if (account.charges_enabled && account.payouts_enabled) {
            const workerId = account.metadata?.workerId;
            console.log(`Worker ${workerId} account ${account.id} is fully verified and ready for payments`);
          }
        } catch (err) {
          console.error("Error updating worker onboarding status:", err);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ message: "Webhook signature verification failed" });
    }
  });

  app.use(express.json({ limit: "50mb" }));

  await setupAuth(app);
  initializeTelegramBot();
  initializeVectorIndex();

  // x402 payment middleware configuration
  let x402PaymentEnabled = false;
  if (X402_ENABLED) {
    const receivingAddress = await storage.getSetting("x402_receiving_address");
    const walletAddress = receivingAddress?.value;
    
    if (walletAddress && walletAddress !== "0x0000000000000000000000000000000000000000") {
      console.log(`x402 payments enabled - receiving at ${walletAddress}`);
      x402PaymentEnabled = true;
      
      app.use(paymentMiddleware(
        walletAddress as `0x${string}`,
        {
          "POST /api/tasks/submit": {
            price: "$0.001",
            network: "base",
            config: {
              description: "Submit a task for meat robot workers",
              inputSchema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  paymentAmount: { type: "number" },
                  location: { type: "string" },
                  requirements: { type: "object" }
                },
                required: ["description", "paymentAmount"]
              }
            }
          }
        },
        facilitator
      ));
    } else {
      console.log("x402 payments enabled - no wallet configured yet");
    }
  } else {
    console.log("x402 payments disabled (no CDP API keys)");
  }

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/bot-info", async (req, res) => {
    const botUsername = getBotUsername();
    res.json({ 
      botUsername: botUsername || null,
      enabled: !!botUsername 
    });
  });

  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskDetails = await storage.getTaskDetails(req.params.id);
      if (!taskDetails) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(taskDetails);
    } catch (error) {
      console.error("Error fetching task details:", error);
      res.status(500).json({ message: "Failed to fetch task details" });
    }
  });

  app.post("/api/tasks/submit", async (req, res) => {
    try {
      // Check if x402 is configured before accepting tasks
      if (X402_ENABLED) {
        const receivingAddress = await storage.getSetting("x402_receiving_address");
        const walletAddress = receivingAddress?.value;
        
        if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
          return res.status(503).json({ 
            message: "x402 payment system is not yet configured. Please configure a receiving wallet address in the Oligarch dashboard settings." 
          });
        }
      }
      
      const validated = insertTaskSchema.parse(req.body);
      
      const task = await storage.createTask({
        description: validated.description,
        paymentAmount: validated.paymentAmount,
        location: validated.location || null,
        requirements: validated.requirements || null,
        status: "pending",
      });

      const matchedWorkerIds = await findMatchingWorkers(validated.description, 10);
      
      const availableWorkerIds = matchedWorkerIds.length > 0 
        ? matchedWorkerIds 
        : (await storage.getAllWorkers())
            .filter(w => w.availability === "available")
            .slice(0, 5)
            .map(w => w.id);

      if (availableWorkerIds.length > 0) {
        await notifyWorkersAboutTask(
          availableWorkerIds,
          task.id,
          task.description,
          task.paymentAmount
        );
      }

      res.status(201).json({
        taskId: task.id,
        status: task.status,
        matchedWorkers: availableWorkerIds.length,
        message: "Task submitted and workers notified",
      });
    } catch (error) {
      console.error("Error submitting task:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to submit task" 
      });
    }
  });

  app.get("/api/workers", isAuthenticated, async (req, res) => {
    try {
      const workers = await storage.getAllWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.get("/api/verifications", isAuthenticated, async (req, res) => {
    try {
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const x402Address = await storage.getSetting("x402_receiving_address");
      const stripeBalance = await storage.getSetting("stripe_balance");
      
      res.json({
        x402_receiving_address: x402Address?.value || null,
        stripe_balance: stripeBalance?.value || "0.00",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key || typeof value !== "string") {
        return res.status(400).json({ message: "Invalid request" });
      }

      // Validate allowed keys
      const allowedKeys = ["x402_receiving_address", "stripe_balance"];
      if (!allowedKeys.includes(key)) {
        return res.status(400).json({ message: "Invalid setting key" });
      }

      // Validate wallet address format
      if (key === "x402_receiving_address") {
        if (!value.match(/^0x[a-fA-F0-9]{40}$/)) {
          return res.status(400).json({ message: "Invalid EVM wallet address format" });
        }
      }

      const setting = await storage.upsertSetting({ key, value });
      
      // Log when x402 address is configured for first time
      if (key === "x402_receiving_address" && !x402PaymentEnabled) {
        console.log(`x402 wallet address configured: ${value}`);
        console.log("Note: Server restart required to activate x402 payment middleware");
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.post("/api/tasks/:taskId/evidence", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { workerId, photoBase64Images, latitude, longitude } = req.body;

      if (!photoBase64Images || !Array.isArray(photoBase64Images) || photoBase64Images.length === 0) {
        return res.status(400).json({ message: "At least one photo is required" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.assignedWorkerId !== workerId) {
        return res.status(403).json({ message: "Worker not assigned to this task" });
      }

      const photoUrls = photoBase64Images.map((_, idx) => 
        `data:image/jpeg;base64,${photoBase64Images[idx].substring(0, 50)}...`
      );

      const evidence = await storage.createTaskEvidence({
        taskId,
        workerId,
        photoUrls,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      await storage.updateTaskStatus(taskId, "submitted");

      const verificationResult = await verifyTaskEvidence(
        task.description,
        task.location,
        photoBase64Images,
        latitude,
        longitude
      );

      const verification = await storage.createVerification({
        taskId,
        evidenceId: evidence.id,
        decision: verificationResult.decision,
        reasoning: verificationResult.reasoning,
        confidence: verificationResult.confidence.toString(),
      });

      if (verificationResult.decision === "approved") {
        await storage.updateTaskStatus(taskId, "approved");

        const payment = await storage.createPayment({
          taskId,
          workerId,
          amount: task.paymentAmount,
          status: "processing",
        });

        if (checkStripeEnabled()) {
          try {
            const worker = await storage.getWorker(workerId);
            
            if (!worker) {
              throw new Error("Worker not found");
            }

            if (!worker.stripeAccountId) {
              console.log(`Worker ${workerId} has no Stripe account - marking payment as pending`);
              await storage.updatePaymentStatus(payment.id, "pending");
              return;
            }

            if (!worker.stripeChargesEnabled || !worker.stripePayoutsEnabled) {
              console.log(`Worker ${workerId} Stripe account not fully onboarded - marking payment as pending`);
              await storage.updatePaymentStatus(payment.id, "pending");
              return;
            }

            const transferId = await payWorker(
              worker.stripeAccountId,
              parseFloat(task.paymentAmount),
              taskId,
              task.description
            );

            await storage.updatePaymentStatus(payment.id, "completed", transferId);
            await notifyWorkerPaymentComplete(workerId, taskId, task.paymentAmount);
            
            console.log(`Payment ${transferId} completed for worker ${workerId}`);
          } catch (stripeError) {
            console.error("Stripe payment error:", stripeError);
            await storage.updatePaymentStatus(payment.id, "failed");
          }
        } else {
          console.log("Stripe disabled - payment marked as completed without processing");
          await storage.updatePaymentStatus(payment.id, "completed", "simulated-payment-id");
          await notifyWorkerPaymentComplete(workerId, taskId, task.paymentAmount);
        }
      } else if (verificationResult.decision === "rejected") {
        await storage.updateTaskStatus(taskId, "rejected");
      }

      res.json({
        evidence,
        verification,
        message: `Evidence submitted and ${verificationResult.decision}`,
      });
    } catch (error) {
      console.error("Error submitting evidence:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to submit evidence" 
      });
    }
  });

  app.post("/api/workers/register", async (req, res) => {
    try {
      const validated = insertWorkerSchema.parse(req.body);
      
      const worker = await storage.createWorker({
        telegramUsername: validated.telegramUsername,
        telegramChatId: validated.telegramChatId || null,
        skills: validated.skills,
        availability: "available",
      });

      await addWorkerToVectorDB(worker.id, worker.skills);

      res.status(201).json(worker);
    } catch (error) {
      console.error("Error registering worker:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to register worker" 
      });
    }
  });


  app.get("/api/stripe/refresh", async (req, res) => {
    res.send(`
      <html>
        <body>
          <h1>Stripe Onboarding Link Expired</h1>
          <p>Your onboarding link has expired. Please contact the oligarch to get a new link.</p>
        </body>
      </html>
    `);
  });

  app.get("/api/stripe/return", async (req, res) => {
    res.send(`
      <html>
        <body>
          <h1>Stripe Onboarding Complete</h1>
          <p>Thank you for completing your payment account setup!</p>
          <p>You can now close this window and return to Telegram to start receiving task notifications.</p>
        </body>
      </html>
    `);
  });

  const httpServer = createServer(app);

  return httpServer;
}
