# Stripe Setup for SqueakyBill Invoicing App

This document outlines the requirements and steps to connect Stripe to the SqueakyBill app via the nudgepay-api Cloudflare Worker. The app already includes Stripe Connect integration with configured secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET) and functions like createStripePaymentLink, createConnectAccount, createAccountLink, createCheckoutSession, and createPortalSession. It uses a D1 database for invoices and Resend for emails (in sandbox mode).

## 1. Stripe Dashboard Settings to Configure

### Webhooks
- In the Stripe Dashboard, navigate to Developers > Webhooks.
- Create separate webhook endpoints for account and Connect events.
- For Connect webhooks: Set "Listen to" to "Events on Connected accounts" (or set `connect: true` via API).
- Configure endpoints to receive events like `account.updated`, `payment_intent.succeeded`, `payout.failed`, etc.
- Development URLs receive only test webhooks; production receives both live and test (check `livemode` flag).

### Connect Settings
- Go to Settings > Connect in the Dashboard.
- Configure onboarding interface: Enable "Copy platform branding" to apply your platform's branding to new connected accounts.
- Set up platform controls for Express/Custom accounts if needed (e.g., for managing payouts, updates).
- Review compliance settings and ensure KYC/verification flows are enabled.

### Branding
- In Settings > Branding, customize your platform's logo, icon, colors, etc.
- Enable "Copy platform branding" in Connect settings to automatically apply to connected accounts.
- For existing accounts, update via API: Use `settings.branding` (v1) or `configuration.merchant.branding` (v2).

## 2. Webhook Endpoints to Register

Assuming the nudgepay-api Worker handles webhooks, register the following exact URLs in the Stripe Dashboard (replace `your-worker-domain` with the actual Cloudflare Worker URL, e.g., `nudgepay-api.yourdomain.workers.dev`):

- Platform Webhook (for your account's events): `https://your-worker-domain/webhook/stripe` (uses STRIPE_WEBHOOK_SECRET).
- Connect Webhook (for connected accounts' events): `https://your-worker-domain/webhook/stripe-connect` (uses STRIPE_CONNECT_WEBHOOK_SECRET).

- Add these in Dashboard > Developers > Webhooks.
- Select relevant events (e.g., `account.updated`, `payment_intent.succeeded`, `payout.failed`, `account.application.deauthorized`).
- Test endpoints using Stripe CLI: `stripe listen --forward-to <url>` and `stripe trigger <event>`.

## 3. Connect Onboarding Flow – User Experience

Stripe Connect onboarding varies by account type (Standard, Express, Custom). Assuming Express/Custom for platform control:

- **Create Account**: Use `createConnectAccount` to generate a connected account ID.
- **Onboarding Link**: Call `createAccountLink` to get a URL redirecting the user to Stripe's hosted onboarding page.
- **User Experience**:
  - User is redirected to a Stripe-hosted form (branded with your platform if configured).
  - They provide business details, personal info, bank account for payouts, and accept ToS.
  - KYC verification: Upload ID documents, address proof (if required).
  - For Express: Users get a dashboard to manage payouts/settings.
  - Completion redirects back to your app (success URL).
  - Handle refreshes if incomplete (use `account.updated` webhook to monitor status).
- Post-onboarding: Use `createPortalSession` for users to manage their Stripe account.

## 4. Test Mode vs Live Mode Checklist

### Test Mode
- Use test API keys (publishable and secret).
- Test cards: e.g., 4242424242424242 (Visa) for successful payments.
- Simulate events with Stripe CLI or test webhooks.
- No real funds move; use sandbox accounts.
- Emails via Resend in sandbox (to onboarding@resend.dev).
- Verify functions: Create test invoices in D1, generate payment links/sessions.

### Live Mode
- Switch to live API keys.
- Ensure all connected accounts are verified (status: enabled).
- Test with real cards (small amounts) after going live.
- Monitor webhooks for live events (check `livemode: true`).
- Disable Resend sandbox; use production email.
- Compliance: All accounts must have accepted ToS and completed KYC.
- Payouts: Ensure bank accounts are verified.

## 5. Compliance Requirements (ToS, KYC)

- **Terms of Service (ToS)**: Users must accept Stripe's Connected Account Agreement during onboarding. Platforms must ensure compliance with Stripe Services Agreement.
- **KYC (Know Your Customer)**: Required info varies by country/business type (e.g., ID documents, address proof, beneficial owners >25%).
  - Use Persons API for owners/executives.
  - Monitor `account.updated` and `person.updated` webhooks for due requirements.
  - Upload documents via API if verification fails.
- Other: GDPR compliance for EU, sanctions checks, ongoing monitoring for changes (e.g., expired docs in UAE).
- Platforms cover account losses; use webhooks to handle restrictions/rejections.

## 6. Steps to Go from Test to Production

1. Complete test mode verification: Simulate full flow (account creation, onboarding, payments, webhooks).
2. Configure live dashboard settings (webhooks, branding, Connect).
3. Switch to live keys in Worker environment variables.
4. Onboard real connected accounts: Create live accounts, generate onboarding links.
5. Verify compliance: Ensure KYC complete, ToS accepted, accounts enabled.
6. Test live payments: Process small real transactions, confirm payouts.
7. Monitor and handle webhooks for production events.
8. Go live: Update app to use live mode; remove sandbox restrictions (e.g., Resend).
9. Post-launch: Use dashboard to review accounts, handle requirement updates.

## 7. Pricing/Fees Breakdown for Stripe Connect

Stripe Connect pricing is pay-as-you-go, with options for platforms to handle fees or let Stripe manage.

- **Stripe Handles Pricing**: No platform fees; earn revenue share on card transactions.
- **You Handle Pricing**:
  - $2 per monthly active account.
  - 0.25% + $0.25 per payout.
  - Instant payouts: 1% of volume.
  - Cross-border payouts: Starting at 0.25%.
- Payments Processing: Starts at 2.9% + $0.30 per successful card charge (varies by region).
- Other: 1099 tax forms ($2.99 e-filed, $1.49 state, $2.99 mailed); Billing (1% of volume for subscriptions).
- No fees for onboarding, risk monitoring, dashboards.

For detailed pricing, see [Stripe Connect Pricing](https://stripe.com/connect/pricing).