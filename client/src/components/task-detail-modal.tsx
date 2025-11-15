import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, DollarSign, User, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { data: taskDetails, isLoading } = useQuery<{
    task: any;
    worker: any;
    evidence: any;
    verification: any;
    payment: any;
  }>({
    queryKey: ["/api/tasks", taskId],
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-task-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Task Details
            {taskDetails && getStatusBadge(taskDetails.task.status)}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : taskDetails ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div className="text-base">{taskDetails.task.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Payment Amount
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      ${taskDetails.task.paymentAmount}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created At
                    </div>
                    <div className="text-base">
                      {taskDetails.task.createdAt
                        ? new Date(taskDetails.task.createdAt).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                </div>

                {taskDetails.task.location && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <div className="text-base">{taskDetails.task.location}</div>
                  </div>
                )}

                {taskDetails.task.requirements && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Requirements</div>
                    <div className="text-base">
                      {JSON.stringify(taskDetails.task.requirements, null, 2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {taskDetails.worker && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned Worker
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telegram</span>
                    <span className="font-medium">@{taskDetails.worker.telegramUsername}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <span className="font-medium">{taskDetails.worker.rating || "0.00"} / 5.00</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Tasks</span>
                    <span className="font-medium">{taskDetails.worker.completedTasks}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {taskDetails.evidence && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Evidence Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {taskDetails.evidence.photoUrls && taskDetails.evidence.photoUrls.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Photos</div>
                      <div className="grid grid-cols-2 gap-2">
                        {taskDetails.evidence.photoUrls.map((url: string, idx: number) => (
                          <div key={idx} className="aspect-video bg-muted rounded-md overflow-hidden">
                            <img
                              src={url}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {taskDetails.evidence.latitude && taskDetails.evidence.longitude && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Geolocation
                      </div>
                      <div className="text-base">
                        {taskDetails.evidence.latitude}, {taskDetails.evidence.longitude}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submitted At</span>
                    <span className="text-sm">
                      {taskDetails.evidence.submittedAt
                        ? new Date(taskDetails.evidence.submittedAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {taskDetails.verification && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    AI Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Decision</span>
                    {getStatusBadge(taskDetails.verification.decision)}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {taskDetails.verification.confidence
                        ? `${parseFloat(taskDetails.verification.confidence) * 100}%`
                        : "—"}
                    </span>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">AI Reasoning</div>
                    <div className="text-sm bg-muted p-3 rounded-md">
                      {taskDetails.verification.reasoning}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Analyzed At</span>
                    <span className="text-sm">
                      {taskDetails.verification.analyzedAt
                        ? new Date(taskDetails.verification.analyzedAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {taskDetails.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-lg font-bold text-green-700">
                      ${taskDetails.payment.amount}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(taskDetails.payment.status)}
                  </div>
                  {taskDetails.payment.stripePaymentId && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stripe ID</span>
                        <span className="text-xs font-mono">{taskDetails.payment.stripePaymentId}</span>
                      </div>
                    </>
                  )}
                  {taskDetails.payment.paidAt && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Paid At</span>
                        <span className="text-sm">
                          {new Date(taskDetails.payment.paidAt).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Task not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
