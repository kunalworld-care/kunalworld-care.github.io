# kunalji-pay (Cloudflare Worker)

Backend for crypto checkout auto-confirmation:

- `POST /create-invoice` - called by the website (pricing page); creates a
  fixed-amount NOWPayments invoice and returns its hosted payment URL. The
  NOWPayments API key stays server-side as a Worker secret.
- `POST /ipn` - NOWPayments Instant Payment Notification webhook. Verifies the
  `x-nowpayments-sig` HMAC-SHA512 signature with the IPN secret, then emails
  the payment result (CONFIRMED / FAILED / EXPIRED / PARTIALLY PAID) through
  Web3Forms, carrying the `KW-...` reference that links it to the checkout
  "payment started" email.

Secrets (set with `wrangler secret put`, never in code):
NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET, WEB3FORMS_KEY, CLIENT_TOKEN.
Var: SITE_ORIGIN = https://kunalworld-care.github.io

Deployed at https://kunalji-pay.dx1qne.workers.dev (free tier).
NOWPayments dashboard: IPN secret generated, webhook URL set to
https://kunalji-pay.dx1qne.workers.dev/ipn.
