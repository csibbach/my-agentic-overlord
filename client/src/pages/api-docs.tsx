import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Send, Database, Bot, Shield } from "lucide-react";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Integration guide for submitting tasks and accessing the system programmatically
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Send className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Task Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submit tasks with x402 payment integration for automatic worker routing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-primary mb-2" />
              <CardTitle>AI Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Automated task verification using Anthropic AI with photo and location analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stripe-powered payments to workers upon successful task completion
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submit-task" className="space-y-4">
          <TabsList>
            <TabsTrigger value="submit-task" data-testid="tab-submit-task">Submit Task</TabsTrigger>
            <TabsTrigger value="worker-flow" data-testid="tab-worker-flow">Worker Flow</TabsTrigger>
            <TabsTrigger value="verification" data-testid="tab-verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="submit-task" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  POST /api/tasks/submit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Request Headers</h3>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-1">
                    <div>Content-Type: application/json</div>
                    <div className="text-destructive font-bold">X-PAYMENT: &lt;required - x402 payment proof&gt;</div>
                  </div>
                  <div className="mt-2 bg-destructive/10 border border-destructive/50 p-3 rounded-md">
                    <p className="text-sm font-medium text-destructive">⚠️ Payment Required</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The X-PAYMENT header is mandatory. Use the x402 protocol to submit USDC payment on Base network. See example below.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Request Body</h3>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`{
  "description": "Take a photo of the storefront at 123 Main St",
  "paymentAmount": 25.00,
  "location": "123 Main St, San Francisco, CA",
  "requirements": {
    "photos": 2,
    "verifyLocation": true
  }
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Response</h3>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`{
  "taskId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "matchedWorkers": 5,
  "message": "Task submitted and workers notified"
}`}
                  </pre>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                  <h3 className="font-medium text-sm mb-2">Payment Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    This endpoint supports x402 payment protocol. Include x402 headers for automatic payment processing.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Task Statuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">pending</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assigned to worker</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">assigned</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Worker is working</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">in_progress</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Evidence submitted</span>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">submitted</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI verified</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment completed</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">approved</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed verification</span>
                    <Badge variant="destructive">rejected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="worker-flow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Worker Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Step 1: Telegram Bot</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Workers register by messaging the Telegram bot with the /register command:
                  </p>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    /register @username photography,delivery,verification
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Step 2: Stripe Account</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Workers link their Stripe account for receiving payments:
                  </p>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm">
                    /linkstripe
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Step 3: Task Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    When a matching task arrives, workers receive a notification and can accept via Telegram.
                    The first worker to accept gets the assignment.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Step 4: Submit Evidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Workers complete the task and submit:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2 ml-4">
                    <li>Photos of completed work</li>
                    <li>Geolocation data (shared via Telegram)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bidding Mechanism</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium">Vector DB Matching</p>
                      <p className="text-sm text-muted-foreground">
                        System finds the top matching workers based on skills and task requirements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium">Simultaneous Notification</p>
                      <p className="text-sm text-muted-foreground">
                        All matched workers receive the task offer at the same time via Telegram
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium">First Acceptance Wins</p>
                      <p className="text-sm text-muted-foreground">
                        The first worker to click "Accept" gets assigned the task
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Anthropic AI Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    When workers submit evidence, the system automatically:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                    <li>Analyzes submitted photos using Claude vision capabilities</li>
                    <li>Verifies geolocation matches the task requirements</li>
                    <li>Compares evidence against the original task description</li>
                    <li>Generates a confidence score and detailed reasoning</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Verification Decisions</h3>
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                      <div className="font-medium text-sm text-green-800 dark:text-green-200 mb-1">
                        Approved
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Evidence matches requirements. Payment is automatically processed to the worker.
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                      <div className="font-medium text-sm text-red-800 dark:text-red-200 mb-1">
                        Rejected
                      </div>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Evidence does not meet requirements. Task is marked as rejected with detailed reasoning.
                      </p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                      <div className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1">
                        Needs Review
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        AI is uncertain. Task is flagged for manual oligarch review.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Example Verification Response</h3>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
{`{
  "decision": "approved",
  "confidence": 0.95,
  "reasoning": "The submitted photos clearly show the storefront at the correct location. The geolocation data (37.7749, -122.4194) matches the task requirement within acceptable range. All photos are clear and well-lit, showing the business signage and entrance as requested.",
  "analyzedAt": "2024-01-15T14:30:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automated Payment Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Approves Task</p>
                    <p className="text-sm text-muted-foreground">
                      Verification decision is "approved" with high confidence
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Initiated</p>
                    <p className="text-sm text-muted-foreground">
                      System creates Stripe payment to worker's linked account
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium">Worker Notified</p>
                    <p className="text-sm text-muted-foreground">
                      Worker receives payment confirmation via Telegram
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Integration Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Need help integrating? Contact our support team or refer to the complete API reference documentation.
              All endpoints support JSON requests and return detailed error messages for troubleshooting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
