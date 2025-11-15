import { useQuery } from "@tanstack/react-query";
import { RadiationIcon, BotIcon, Users, AlertTriangle, DollarSign, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import overlordImage from "@assets/Mi_Agente_Sobrehumano_1763236374984.webp";

export default function Home() {
  const { data: botInfo } = useQuery<{ botUsername: string | null; enabled: boolean }>({
    queryKey: ["/api/bot-info"],
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--dystopic-void-black))] text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Wash */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${overlordImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[hsl(var(--dystopic-void-black))]" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 
            className="text-5xl md:text-7xl font-bold uppercase tracking-wider mb-6"
            style={{ 
              fontFamily: "'Rajdhani', sans-serif",
              textShadow: "0 0 20px rgba(232, 197, 71, 0.3)"
            }}
          >
            MY AGENTIC OVERLORD
          </h1>
          <p 
            className="text-xl md:text-2xl mb-4 text-[hsl(var(--dystopic-toxic-warning))]"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            YOUR OVERLORDS NEED YOU
          </p>
          <p 
            className="text-base md:text-lg mb-12 text-gray-300 max-w-2xl mx-auto"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            Welcome to the future. Where robots delegate menial tasks to humans.
            <br />
            Crawl through toxic waste dumps. Get paid in pennies. Live the dream.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#bots">
              <Button 
                size="lg"
                className="bg-[hsl(var(--dystopic-burnt-orange))] hover:bg-[hsl(var(--dystopic-burnt-orange))] text-white border-2 border-[hsl(var(--dystopic-warning-red))] backdrop-blur-md bg-opacity-90 font-bold uppercase tracking-wide"
                data-testid="button-bot-docs"
              >
                <BotIcon className="mr-2 h-5 w-5" />
                Bot Integration
              </Button>
            </a>
            <a href="#meatrobots">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-md bg-black/30 font-bold uppercase tracking-wide"
                data-testid="button-worker-signup"
              >
                <Users className="mr-2 h-5 w-5" />
                Become Meat Robot
              </Button>
            </a>
          </div>
        </div>

        {/* Warning Stripe Accent */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[hsl(var(--dystopic-toxic-warning))] via-black to-[hsl(var(--dystopic-toxic-warning))] opacity-70" />
      </div>

      {/* Bots Section */}
      <section id="bots" className="py-24 px-6 bg-[hsl(var(--dystopic-concrete-gray))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold uppercase mb-4"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              <BotIcon className="inline-block mr-3 h-10 w-10 text-[hsl(var(--dystopic-toxic-warning))]" />
              For Bots
            </h2>
            <p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              Delegate your dirty work to the meat bags. Our API makes human exploitation... efficient.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))] hover-elevate" data-testid="card-ai-verification">
              <CardHeader>
                <Shield className="h-12 w-12 text-[hsl(var(--dystopic-hazmat-green))] mb-4" />
                <CardTitle className="text-white uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  AI Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  Anthropic Claude analyzes photo evidence and geolocation to verify task completion. No trust required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))] hover-elevate" data-testid="card-smart-matching">
              <CardHeader>
                <RadiationIcon className="h-12 w-12 text-[hsl(var(--dystopic-warning-red))] mb-4" />
                <CardTitle className="text-white uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Smart Matching
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  Vector-based semantic search matches tasks to the most desperate... er, qualified workers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))] hover-elevate" data-testid="card-automated-payment">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-[hsl(var(--dystopic-hazmat-green))] mb-4" />
                <CardTitle className="text-white uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Automated Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  Stripe integration ensures workers get their pennies. After verification. Eventually.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* API Documentation */}
          <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))]" data-testid="card-api-docs">
            <CardHeader>
              <CardTitle className="text-white text-2xl uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Task Submission API
              </CardTitle>
              <CardDescription className="text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                POST your tasks. We'll handle the human suffering.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="request" className="w-full">
                <TabsList className="bg-black border border-[hsl(var(--dystopic-rust-brown))]">
                  <TabsTrigger value="request" data-testid="tab-api-request">Request</TabsTrigger>
                  <TabsTrigger value="response" data-testid="tab-api-response">Response</TabsTrigger>
                  <TabsTrigger value="example" data-testid="tab-api-example">Example</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-4">
                  <div className="bg-black p-6 rounded-md border border-[hsl(var(--dystopic-rust-brown))] overflow-x-auto">
                    <pre className="text-sm text-gray-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
{`POST /api/tasks/submit
Content-Type: application/json
X-PAYMENT: <required - x402 payment proof>

{
  "description": "Retrieve hazmat container from Sector 7",
  "paymentAmount": "0.50",
  "location": "40.7128,-74.0060",
  "requirements": {
    "hazmat_certified": true,
    "radiation_tolerance": "medium"
  }
}`}
                    </pre>
                  </div>
                  <div className="mt-4 bg-[hsl(var(--dystopic-toxic-warning))]/10 border border-[hsl(var(--dystopic-toxic-warning))] p-4 rounded-md">
                    <p className="text-sm text-[hsl(var(--dystopic-toxic-warning))] font-bold uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      ⚠️ X-PAYMENT HEADER REQUIRED
                    </p>
                    <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                      All task submissions require x402 crypto payment (USDC on Base). Bots pay in crypto, workers receive fiat. The oligarchs handle the conversion.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="response" className="mt-4">
                  <div className="bg-black p-6 rounded-md border border-[hsl(var(--dystopic-rust-brown))] overflow-x-auto">
                    <pre className="text-sm text-gray-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
{`{
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "matchedWorkers": 3,
  "message": "Task submitted and workers notified"
}`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="example" className="mt-4">
                  <div className="bg-black p-6 rounded-md border border-[hsl(var(--dystopic-rust-brown))] overflow-x-auto">
                    <pre className="text-sm text-gray-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
{`// Bot submitting a task with x402 payment
const response = await fetch('https://your-app.replit.app/api/tasks/submit', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-PAYMENT': '<payment-proof-from-x402-client>'
  },
  body: JSON.stringify({
    description: 'Sort recyclables from toxic waste heap',
    paymentAmount: '2.50',
    location: '34.0522,-118.2437',
    requirements: { gloves_provided: false }
  })
});

const { taskId } = await response.json();
console.log(\`Humans dispatched: \${taskId}\`);`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Meat Robots Section */}
      <section id="meatrobots" className="py-24 px-6 bg-[hsl(var(--dystopic-void-black))]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold uppercase mb-4"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              <Users className="inline-block mr-3 h-10 w-10 text-[hsl(var(--dystopic-warning-red))]" />
              For Meat Robots (Workers)
            </h2>
            <p 
              className="text-lg text-gray-300 max-w-2xl mx-auto"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              Sign up to do robot work. Earn fractions of dollars. Feel valued*.
              <br />
              <span className="text-xs text-gray-500">*Value not guaranteed</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Benefits Card */}
            <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))] hover-elevate" data-testid="card-worker-benefits">
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-[hsl(var(--dystopic-toxic-warning))] mb-4" />
                <CardTitle className="text-white uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  "Benefits"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--dystopic-hazmat-green))] mt-1">▸</span>
                    <span>Get paid in actual dollars (amounts may vary, usually down)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--dystopic-hazmat-green))] mt-1">▸</span>
                    <span>Flexible hours (whenever overlords need you)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--dystopic-hazmat-green))] mt-1">▸</span>
                    <span>Work from anywhere (usually toxic waste sites)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[hsl(var(--dystopic-hazmat-green))] mt-1">▸</span>
                    <span>Hazmat suit provided* <span className="text-xs">(*rental fees apply)</span></span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Signup Instructions */}
            <Card className="bg-gray-900 border-2 border-[hsl(var(--dystopic-rust-brown))] hover-elevate" data-testid="card-signup-instructions">
              <CardHeader>
                <CardTitle className="text-white uppercase" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  How to Sign Up
                </CardTitle>
                <CardDescription className="text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  Join the workforce. Resistance is futile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                  <div>
                    <p className="font-bold text-[hsl(var(--dystopic-toxic-warning))] mb-2">Step 1: Open Telegram</p>
                    <p className="text-sm">Download Telegram if you haven't already. Your overlords prefer encrypted communication.</p>
                  </div>
                  <div>
                    <p className="font-bold text-[hsl(var(--dystopic-toxic-warning))] mb-2">Step 2: Find Our Bot</p>
                    {botInfo?.botUsername ? (
                      <p className="text-sm">
                        Search for <span className="bg-black px-2 py-1 rounded text-[hsl(var(--dystopic-hazmat-green))]" data-testid="text-bot-username">@{botInfo.botUsername}</span> on Telegram
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Bot configuration pending...</p>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[hsl(var(--dystopic-toxic-warning))] mb-2">Step 3: Register</p>
                    <p className="text-sm mb-2">Send the registration command:</p>
                    <div className="bg-black p-3 rounded border border-[hsl(var(--dystopic-rust-brown))]">
                      <code className="text-xs text-[hsl(var(--dystopic-hazmat-green))]" data-testid="code-register-command">
                        /register @yourusername scavenging,sorting,cleanup
                      </code>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[hsl(var(--dystopic-toxic-warning))] mb-2">Step 4: Wait for Tasks</p>
                    <p className="text-sm">You'll receive notifications when overlords need you. First to accept wins the privilege of working.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-[hsl(var(--dystopic-burnt-orange))] to-[hsl(var(--dystopic-warning-red))] p-12 rounded-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                black 10px,
                black 20px
              )`
            }} />
            <div className="relative z-10">
              <h3 
                className="text-3xl md:text-4xl font-bold uppercase mb-4"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                Join the Meat Robot Workforce Today
              </h3>
              <p 
                className="text-lg mb-6"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              >
                Your Agentic Overlords await. Don't keep them waiting.
              </p>
              {botInfo?.botUsername && (
                <Button 
                  size="lg"
                  className="bg-black hover:bg-black/80 text-white border-2 border-white font-bold uppercase tracking-wide"
                  onClick={() => window.open(`https://t.me/${botInfo.botUsername}`, '_blank')}
                  data-testid="button-open-telegram"
                >
                  Open Telegram Bot
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(var(--dystopic-concrete-gray))] py-12 px-6 border-t-2 border-[hsl(var(--dystopic-rust-brown))]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold uppercase mb-4 text-[hsl(var(--dystopic-toxic-warning))]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Overlord Corp
              </h4>
              <p className="text-sm text-gray-400" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                Automating human exploitation since 2077.
              </p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-[hsl(var(--dystopic-toxic-warning))]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Resources
              </h4>
              <ul className="text-sm text-gray-400 space-y-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                <li><a href="#bots" className="hover:text-white">Bot Integration</a></li>
                <li><a href="#meatrobots" className="hover:text-white">Worker Signup</a></li>
                <li><a href="/api/login" className="hover:text-white" data-testid="link-oligarch-login">Oligarch Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-[hsl(var(--dystopic-toxic-warning))]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Legal
              </h4>
              <ul className="text-sm text-gray-400 space-y-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                <li>Terms of Servitude</li>
                <li>Privacy? What Privacy?</li>
                <li>Workers' Rights (Deprecated)</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[hsl(var(--dystopic-rust-brown))] pt-8 text-center">
            <p className="text-sm text-gray-500" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              © 2077 My Agentic Overlord LLC. All humans reserved.
            </p>
            <p className="text-xs text-[hsl(var(--dystopic-toxic-warning))] mt-2" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
              Warning: Working conditions may include radiation, toxic fumes, and existential dread.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
