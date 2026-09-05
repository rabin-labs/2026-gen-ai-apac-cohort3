# Threat Model

## Protected assets

- Private journal conversations and decision snapshots
- Firebase identity tokens and account metadata
- Gemini API credential and Google Cloud service identity
- Generated insights, review dates, and sensitive-entry settings
- Availability and Gemini quota

## Trust boundaries

1. Browser to Cloud Run over TLS
2. Cloud Run to Firebase Authentication
3. Cloud Run to Firestore through the Admin SDK
4. Cloud Run to Secret Manager
5. Cloud Run to Gemini

## Principal threats and controls

| Threat | Primary controls | Verification |
|---|---|---|
| Cross-user record access | Verified token; UID-derived paths; Firestore deny-by-default rules | Two-user emulator tests |
| Forged or expired identity | Admin SDK token verification with revocation check | API authentication tests |
| Client-submitted UID manipulation | API schemas contain no UID; server derives UID | Code review and negative request test |
| API key exposure | Secret Manager; server-only Gemini client; ignored environment files | Secret scanning and bundle inspection |
| Prompt injection | System policy; journal text treated as data; no model-selected tools | Adversarial prompt tests |
| Oversized input and cost abuse | Message/count limits and per-user rate limits | Boundary tests and monitoring |
| Sensitive logs | Metadata-only errors and audit events | Log review |
| Malformed model output | JSON response mode plus Zod validation | Unit tests |
| XSS/clickjacking | React escaping, CSP, frame-ancestors, nosniff | Header checks |
| Accidental retention | User export/deletion design and documented retention policy | Deletion integration test |

## Residual risks

- The in-memory rate limiter is instance-local. Production scale requires a distributed limiter such as Memorystore or a gateway policy.
- Journal data is encrypted by Google-managed encryption at rest, but the current MVP does not implement application-layer per-user encryption.
- Gemini processes the conversation to provide the requested service. Consent and provider data-processing disclosures must be finalized before public launch.
- Account deletion and export endpoints must be completed and integration-tested before describing the service as generally available.
