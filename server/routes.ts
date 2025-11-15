import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { initializeTelegramBot, notifyWorkersAboutTask, notifyWorkerPaymentComplete } from "./telegramBot";
import { initializeVectorIndex, addWorkerToVectorDB, findMatchingWorkers } from "./vectorService";
import { verifyTaskEvidence } from "./anthropicService";
import { insertTaskSchema, insertWorkerSchema } from "@shared/schema";
import express from "express";

const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json({ limit: "50mb" }));

  initializeTelegramBot();
  initializeVectorIndex();

  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
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

  app.get("/api/workers", async (req, res) => {
    try {
      const workers = await storage.getAllWorkers();
      res.json(workers);
    } catch (error) {
      console.error("Error fetching workers:", error);
      res.status(500).json({ message: "Failed to fetch workers" });
    }
  });

  app.get("/api/verifications", async (req, res) => {
    try {
      const verifications = await storage.getAllVerifications();
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
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

        if (STRIPE_ENABLED && stripe) {
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(parseFloat(task.paymentAmount) * 100),
              currency: "usd",
              description: `Payment for task ${taskId}`,
              metadata: {
                taskId,
                workerId,
                paymentId: payment.id,
              },
            });

            await storage.updatePaymentStatus(payment.id, "completed", paymentIntent.id);

            await notifyWorkerPaymentComplete(workerId, taskId, task.paymentAmount);
          } catch (stripeError) {
            console.error("Stripe payment error:", stripeError);
            await storage.updatePaymentStatus(payment.id, "failed");
          }
        } else {
          console.log("Stripe disabled - payment marked as completed without processing");
          await storage.updatePaymentStatus(payment.id, "completed", "simulated-payment-id");
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

  const httpServer = createServer(app);

  return httpServer;
}
