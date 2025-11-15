// Stripe Connect service for worker payment accounts
import Stripe from "stripe";

const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" })
  : null;

export interface StripeAccountResult {
  accountId: string;
  onboardingUrl: string;
}

export async function createWorkerStripeAccount(
  workerId: string,
  telegramUsername: string
): Promise<StripeAccountResult | null> {
  if (!STRIPE_ENABLED || !stripe) {
    console.log("Stripe not configured - worker payment account creation skipped");
    return null;
  }

  try {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN.replace(/^https?:\/\//, '')}`
      : "http://localhost:5000";

    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        workerId,
        telegramUsername,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/api/stripe/refresh`,
      return_url: `${baseUrl}/api/stripe/return`,
      type: "account_onboarding",
    });

    console.log(`Created Stripe Express account ${account.id} for worker ${workerId}`);

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error) {
    console.error("Error creating Stripe account:", error);
    throw error;
  }
}

export async function checkAccountStatus(accountId: string): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  if (!STRIPE_ENABLED || !stripe) {
    throw new Error("Stripe not configured");
  }

  const account = await stripe.accounts.retrieve(accountId);

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
  };
}

export async function createOnboardingLink(accountId: string): Promise<string> {
  if (!STRIPE_ENABLED || !stripe) {
    throw new Error("Stripe not configured");
  }

  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN.replace(/^https?:\/\//, '')}`
    : "http://localhost:5000";

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/api/stripe/refresh`,
    return_url: `${baseUrl}/api/stripe/return`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function payWorker(
  accountId: string,
  amount: number,
  taskId: string,
  description: string
): Promise<string> {
  if (!STRIPE_ENABLED || !stripe) {
    throw new Error("Stripe not configured");
  }

  const amountInCents = Math.round(amount * 100);

  const transfer = await stripe.transfers.create({
    amount: amountInCents,
    currency: "usd",
    destination: accountId,
    description: `Payment for task ${taskId}: ${description}`,
    metadata: {
      taskId,
    },
  });

  console.log(`Created Stripe transfer ${transfer.id} for ${amount} USD to account ${accountId}`);

  return transfer.id;
}

export function isStripeEnabled(): boolean {
  return STRIPE_ENABLED;
}
