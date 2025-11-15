import {
  workers,
  tasks,
  taskAssignments,
  taskEvidence,
  verifications,
  payments,
  users,
  settings,
  type Worker,
  type InsertWorker,
  type Task,
  type InsertTask,
  type TaskAssignment,
  type InsertTaskAssignment,
  type TaskEvidence,
  type InsertTaskEvidence,
  type Verification,
  type InsertVerification,
  type Payment,
  type InsertPayment,
  type User,
  type UpsertUser,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  createWorker(worker: InsertWorker): Promise<Worker>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkersByIds(ids: string[]): Promise<Worker[]>;
  getWorkerByChatId(chatId: string): Promise<Worker | undefined>;
  getAllWorkers(): Promise<Worker[]>;
  updateWorkerAvailability(id: string, availability: string): Promise<void>;
  
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  updateTaskStatus(id: string, status: string, assignedWorkerId?: string): Promise<void>;
  
  createTaskAssignment(assignment: InsertTaskAssignment): Promise<TaskAssignment>;
  acceptTask(taskId: string, workerId: string): Promise<{ success: boolean }>;
  getTaskAssignments(taskId: string): Promise<TaskAssignment[]>;
  
  createTaskEvidence(evidence: InsertTaskEvidence): Promise<TaskEvidence>;
  getTaskEvidence(taskId: string): Promise<TaskEvidence | undefined>;
  
  createVerification(verification: InsertVerification): Promise<Verification>;
  getAllVerifications(): Promise<Verification[]>;
  
  createPayment(payment: InsertPayment): Promise<Payment>;
  getAllPayments(): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string, stripePaymentId?: string): Promise<void>;
  
  getStats(): Promise<{
    totalTasks: number;
    activeWorkers: number;
    pendingVerifications: number;
    totalPayments: string;
  }>;
  
  getTaskDetails(taskId: string): Promise<{
    task: Task;
    worker: Worker | null;
    evidence: TaskEvidence | null;
    verification: Verification | null;
    payment: Payment | null;
  } | null>;
  
  getSetting(key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const [worker] = await db.insert(workers).values(insertWorker).returning();
    return worker;
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker || undefined;
  }

  async getWorkersByIds(ids: string[]): Promise<Worker[]> {
    if (ids.length === 0) return [];
    return await db.select().from(workers).where(inArray(workers.id, ids));
  }

  async getWorkerByChatId(chatId: string): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.telegramChatId, chatId));
    return worker || undefined;
  }

  async getAllWorkers(): Promise<Worker[]> {
    return await db.select().from(workers).orderBy(desc(workers.createdAt));
  }

  async updateWorkerAvailability(id: string, availability: string): Promise<void> {
    await db
      .update(workers)
      .set({ availability, updatedAt: new Date() })
      .where(eq(workers.id, id));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(id: string, status: string, assignedWorkerId?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (assignedWorkerId !== undefined) {
      updateData.assignedWorkerId = assignedWorkerId;
    }
    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
  }

  async createTaskAssignment(insertAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const [assignment] = await db
      .insert(taskAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async acceptTask(taskId: string, workerId: string): Promise<{ success: boolean }> {
    const task = await this.getTask(taskId);
    if (!task) {
      return { success: false };
    }

    if (task.status !== "pending") {
      return { success: false };
    }

    await db
      .update(taskAssignments)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(and(eq(taskAssignments.taskId, taskId), eq(taskAssignments.workerId, workerId)));

    await this.updateTaskStatus(taskId, "assigned", workerId);

    await db
      .update(taskAssignments)
      .set({ status: "rejected" })
      .where(and(eq(taskAssignments.taskId, taskId), sql`${taskAssignments.workerId} != ${workerId}`));

    return { success: true };
  }

  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));
  }

  async createTaskEvidence(insertEvidence: InsertTaskEvidence): Promise<TaskEvidence> {
    const [evidence] = await db
      .insert(taskEvidence)
      .values(insertEvidence)
      .returning();
    return evidence;
  }

  async getTaskEvidence(taskId: string): Promise<TaskEvidence | undefined> {
    const [evidence] = await db
      .select()
      .from(taskEvidence)
      .where(eq(taskEvidence.taskId, taskId));
    return evidence || undefined;
  }

  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const [verification] = await db
      .insert(verifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async getAllVerifications(): Promise<Verification[]> {
    return await db.select().from(verifications).orderBy(desc(verifications.analyzedAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: string, stripePaymentId?: string): Promise<void> {
    const updateData: any = { status };
    if (status === "completed") {
      updateData.paidAt = new Date();
    }
    if (stripePaymentId) {
      updateData.stripePaymentId = stripePaymentId;
    }
    await db.update(payments).set(updateData).where(eq(payments.id, id));
  }

  async getStats(): Promise<{
    totalTasks: number;
    activeWorkers: number;
    pendingVerifications: number;
    totalPayments: string;
  }> {
    const [tasksCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    const [workersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workers)
      .where(eq(workers.availability, "available"));
    const [verificationsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(verifications)
      .where(eq(verifications.decision, "needs_review"));
    const [paymentsSum] = await db
      .select({ sum: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(eq(payments.status, "completed"));

    return {
      totalTasks: Number(tasksCount?.count || 0),
      activeWorkers: Number(workersCount?.count || 0),
      pendingVerifications: Number(verificationsCount?.count || 0),
      totalPayments: paymentsSum?.sum || "0.00",
    };
  }

  async getTaskDetails(taskId: string): Promise<{
    task: Task;
    worker: Worker | null;
    evidence: TaskEvidence | null;
    verification: Verification | null;
    payment: Payment | null;
  } | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    const worker = task.assignedWorkerId
      ? await this.getWorker(task.assignedWorkerId)
      : null;

    const evidence = await this.getTaskEvidence(taskId);

    const [verification] = evidence
      ? await db
          .select()
          .from(verifications)
          .where(eq(verifications.evidenceId, evidence.id))
      : [null];

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.taskId, taskId));

    return {
      task,
      worker: worker || null,
      evidence: evidence || null,
      verification: verification || null,
      payment: payment || null,
    };
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async upsertSetting(settingData: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(settingData)
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: settingData.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }
}

class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private workers: Map<string, Worker> = new Map();
  private tasks: Map<string, Task> = new Map();
  private taskAssignments: Map<string, TaskAssignment[]> = new Map();
  private taskEvidence: Map<string, TaskEvidence> = new Map();
  private verifications: Verification[] = [];
  private payments: Payment[] = [];
  private settings: Map<string, Setting> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id || "");
    const user: User = {
      id: userData.id || crypto.randomUUID(),
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const worker: Worker = {
      id: crypto.randomUUID(),
      telegramUsername: insertWorker.telegramUsername,
      telegramChatId: insertWorker.telegramChatId ?? null,
      skills: insertWorker.skills ?? [],
      availability: insertWorker.availability ?? "available",
      stripeAccountId: insertWorker.stripeAccountId ?? null,
      rating: "0.00",
      completedTasks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workers.set(worker.id, worker);
    return worker;
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getWorkersByIds(ids: string[]): Promise<Worker[]> {
    return ids.map((id) => this.workers.get(id)).filter((w): w is Worker => w !== undefined);
  }

  async getWorkerByChatId(chatId: string): Promise<Worker | undefined> {
    return Array.from(this.workers.values()).find((w) => w.telegramChatId === chatId);
  }

  async getAllWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateWorkerAvailability(id: string, availability: string): Promise<void> {
    const worker = this.workers.get(id);
    if (worker) {
      worker.availability = availability;
      worker.updatedAt = new Date();
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      description: insertTask.description,
      paymentAmount: insertTask.paymentAmount,
      location: insertTask.location ?? null,
      requirements: insertTask.requirements ?? null,
      status: insertTask.status ?? "pending",
      assignedWorkerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateTaskStatus(id: string, status: string, assignedWorkerId?: string): Promise<void> {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.updatedAt = new Date();
      if (assignedWorkerId !== undefined) {
        task.assignedWorkerId = assignedWorkerId;
      }
    }
  }

  async createTaskAssignment(insertAssignment: InsertTaskAssignment): Promise<TaskAssignment> {
    const assignment: TaskAssignment = {
      id: crypto.randomUUID(),
      ...insertAssignment,
      acceptedAt: null,
      createdAt: new Date(),
    };
    const existing = this.taskAssignments.get(insertAssignment.taskId) || [];
    this.taskAssignments.set(insertAssignment.taskId, [...existing, assignment]);
    return assignment;
  }

  async acceptTask(taskId: string, workerId: string): Promise<{ success: boolean }> {
    const task = await this.getTask(taskId);
    if (!task || task.status !== "pending") {
      return { success: false };
    }

    const assignments = this.taskAssignments.get(taskId) || [];
    const workerAssignment = assignments.find((a) => a.workerId === workerId);
    if (workerAssignment) {
      workerAssignment.status = "accepted";
      workerAssignment.acceptedAt = new Date();
    }

    await this.updateTaskStatus(taskId, "assigned", workerId);

    assignments.forEach((a) => {
      if (a.workerId !== workerId) {
        a.status = "rejected";
      }
    });

    return { success: true };
  }

  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return this.taskAssignments.get(taskId) || [];
  }

  async createTaskEvidence(insertEvidence: InsertTaskEvidence): Promise<TaskEvidence> {
    const evidence: TaskEvidence = {
      id: crypto.randomUUID(),
      ...insertEvidence,
      submittedAt: new Date(),
    };
    this.taskEvidence.set(insertEvidence.taskId, evidence);
    return evidence;
  }

  async getTaskEvidence(taskId: string): Promise<TaskEvidence | undefined> {
    return this.taskEvidence.get(taskId);
  }

  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const verification: Verification = {
      id: crypto.randomUUID(),
      ...insertVerification,
      analyzedAt: new Date(),
    };
    this.verifications.push(verification);
    return verification;
  }

  async getAllVerifications(): Promise<Verification[]> {
    return [...this.verifications].sort(
      (a, b) => b.analyzedAt.getTime() - a.analyzedAt.getTime()
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      ...insertPayment,
      stripePaymentId: null,
      paidAt: null,
      createdAt: new Date(),
    };
    this.payments.push(payment);
    return payment;
  }

  async getAllPayments(): Promise<Payment[]> {
    return [...this.payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updatePaymentStatus(id: string, status: string, stripePaymentId?: string): Promise<void> {
    const payment = this.payments.find((p) => p.id === id);
    if (payment) {
      payment.status = status;
      if (status === "completed") {
        payment.paidAt = new Date();
      }
      if (stripePaymentId) {
        payment.stripePaymentId = stripePaymentId;
      }
    }
  }

  async getStats(): Promise<{
    totalTasks: number;
    activeWorkers: number;
    pendingVerifications: number;
    totalPayments: string;
  }> {
    return {
      totalTasks: this.tasks.size,
      activeWorkers: Array.from(this.workers.values()).filter(
        (w) => w.availability === "available"
      ).length,
      pendingVerifications: this.verifications.filter((v) => v.decision === "needs_review")
        .length,
      totalPayments: this.payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)
        .toFixed(2),
    };
  }

  async getTaskDetails(taskId: string): Promise<{
    task: Task;
    worker: Worker | null;
    evidence: TaskEvidence | null;
    verification: Verification | null;
    payment: Payment | null;
  } | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    const worker = task.assignedWorkerId ? await this.getWorker(task.assignedWorkerId) : null;
    const evidence = await this.getTaskEvidence(taskId);
    const verification = evidence
      ? this.verifications.find((v) => v.evidenceId === evidence.id) || null
      : null;
    const payment = this.payments.find((p) => p.taskId === taskId) || null;

    return {
      task,
      worker: worker || null,
      evidence: evidence || null,
      verification,
      payment,
    };
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async upsertSetting(settingData: InsertSetting): Promise<Setting> {
    const existing = this.settings.get(settingData.key);
    const setting: Setting = {
      id: existing?.id || crypto.randomUUID(),
      key: settingData.key,
      value: settingData.value ?? null,
      updatedAt: new Date(),
    };
    this.settings.set(setting.key, setting);
    return setting;
  }
}

const USE_DATABASE = !!process.env.DATABASE_URL;

export const storage: IStorage = USE_DATABASE ? new DatabaseStorage() : new MemStorage();
