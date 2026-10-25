# EquityScout portfolio integration and contact email

Public routes: /projects/equityscout/ and /apps/equityscout/.
The project is linked from the homepage and Work collection. The calculator is
synthetic, browser-only and unsaved. No private database, password, provider key,
real address or lead was copied. The private Python app is not hosted here.

Contact forms appear on the homepage and /connect/; navigation includes Contact.
Recipient: jacobroutzong@gmail.com (confirmed by owner). FormSubmit is the external
message processor, with visitor disclosure/consent, validation, honeypot, timeout,
duplicate-submit guard, failure states and a native POST fallback. Reply email is
included; no autoresponder sends unsolicited messages to visitor addresses.

First-time delivery requires the owner to click FormSubmit's activation email.
Until activation, a successful HTTP request cannot prove inbox delivery. Verify
an actual test message after activation and check Gmail Spam. No email API key
or new paid service is needed. Service availability and filtering are external.

Docs checked 2026-10-25: https://formsubmit.co/ and
https://formsubmit.co/ajax-documentation . AJAX is the documented submission
path; native POST retains provider CAPTCHA defaults. No CAPTCHA is bypassed.

Cloudflare Pages still uses the existing static Astro build/output. There is no
new Pages project, DNS change, custom domain, runtime worker or new billing
configuration. Public full-app deployment requires separate private production
hosting/authentication work; this integration does not expose localhost.

## Verification record

Local gates: lint and Astro type check pass; 8 Node tests and 20 Ascent tests pass.
Ascent validation uses ASCENT_PYTHON pointed at the bundled Python with NumPy: 319
reference checks and 150 randomized comparisons pass. Build checks 175 internal
links/assets. FormSubmit initially rejected missing website context; a request
using the actual portfolio origin returned its explicit activation-required
response and reported sending the activation email. Delivery remains unverified
until the owner activates and confirms receipt of a subsequent test message.
