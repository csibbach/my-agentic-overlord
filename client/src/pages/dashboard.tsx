import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ClipboardList, 
  Users, 
  CheckCircle2, 
  DollarSign,
  Eye,
  Clock,
  MapPin,
} from "lucide-react";
import { Task, Worker, Verification, Payment } from "@shared/schema";
import { useState } from "react";
import TaskDetailModal from "@/components/task-detail-modal";

export default function Dashboard() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalTasks: number;
    activeWorkers: number;
    pendingVerifications: number;
    totalPayments: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: workers, isLoading: workersLoading } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
  });

  const { data: verifications, isLoading: verificationsLoading } = useQuery<Verification[]>({
    queryKey: ["/api/verifications"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; className?: string }> = {
      pending: { variant: "secondary", className: "bg-blue-100 text-blue-800" },
      assigned: { variant: "secondary", className: "bg-purple-100 text-purple-800" },
      in_progress: { variant: "secondary", className: "bg-amber-100 text-amber-800" },
      submitted: { variant: "secondary", className: "bg-indigo-100 text-indigo-800" },
      verified: { variant: "secondary", className: "bg-green-100 text-green-800" },
      approved: { variant: "secondary", className: "bg-emerald-100 text-emerald-800" },
      rejected: { variant: "destructive" },
      cancelled: { variant: "secondary" },
    };

    const config = statusConfig[status] || { variant: "secondary" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor tasks, workers, and system performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-stat-tasks">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-tasks">
                    {stats?.totalTasks || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all statuses
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-workers">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-active-workers">
                    {stats?.activeWorkers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently available
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-verifications">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-pending-verifications">
                    {stats?.pendingVerifications || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting AI review
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-payments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-total-payments">
                    ${stats?.totalPayments || "0.00"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processed to workers
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="workers" data-testid="tab-workers">Workers</TabsTrigger>
            <TabsTrigger value="verifications" data-testid="tab-verifications">Verifications</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Worker</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map((task) => (
                          <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                            <TableCell className="font-mono text-xs">
                              {task.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {task.description}
                            </TableCell>
                            <TableCell className="font-medium">
                              ${task.paymentAmount}
                            </TableCell>
                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {task.assignedWorkerId ? task.assignedWorkerId.slice(0, 8) : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedTaskId(task.id)}
                                data-testid={`button-view-task-${task.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks yet. Tasks will appear here when submitted.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Workers</CardTitle>
              </CardHeader>
              <CardContent>
                {workersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : workers && workers.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Telegram</TableHead>
                          <TableHead>Skills</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workers.map((worker) => (
                          <TableRow key={worker.id} data-testid={`row-worker-${worker.id}`}>
                            <TableCell className="font-medium">
                              @{worker.telegramUsername}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {worker.skills?.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {worker.skills && worker.skills.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{worker.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={worker.availability === "available" ? "secondary" : "secondary"}
                                className={
                                  worker.availability === "available"
                                    ? "bg-green-100 text-green-800"
                                    : worker.availability === "busy"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {worker.availability}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{worker.rating || "0.00"}</span>
                                <span className="text-muted-foreground text-xs">/ 5.00</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {worker.completedTasks}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No workers registered yet. Workers can register via Telegram.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : verifications && verifications.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task ID</TableHead>
                          <TableHead>Decision</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Reasoning</TableHead>
                          <TableHead>Analyzed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verifications.map((verification) => (
                          <TableRow key={verification.id} data-testid={`row-verification-${verification.id}`}>
                            <TableCell className="font-mono text-xs">
                              {verification.taskId.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(verification.decision)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {verification.confidence ? `${parseFloat(verification.confidence) * 100}%` : "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-sm truncate">
                              {verification.reasoning}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {verification.analyzedAt ? new Date(verification.analyzedAt).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No verifications yet. Verifications appear after task evidence is submitted.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : payments && payments.length > 0 ? (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task ID</TableHead>
                          <TableHead>Worker ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Stripe ID</TableHead>
                          <TableHead>Paid At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                            <TableCell className="font-mono text-xs">
                              {payment.taskId.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {payment.workerId.slice(0, 8)}
                            </TableCell>
                            <TableCell className="font-bold text-green-700">
                              ${payment.amount}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {payment.stripePaymentId || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No payments yet. Payments are processed after successful task verification.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
