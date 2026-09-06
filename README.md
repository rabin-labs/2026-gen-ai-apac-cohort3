# Private Compass

Private Compass is a secure, Gemini-powered decision journal for working adults. It turns a guided conversation into an editable decision snapshot, then helps the user revisit expectations and outcomes through **Decision Replay**.

## Live application

[Launch Private Compass on Cloud Run](https://private-compass-133701402785.asia-southeast1.run.app)

## Security-first design

- Firebase Authentication establishes identity.
- Every API request verifies the Firebase ID token server-side.
- The server derives the UID from the verified token; it never accepts a user ID from the client.
- Firestore records live under `/users/{uid}` and security rules deny cross-user access.
- Gemini credentials stay server-side and are retrieved from Google Cloud Secret Manager in production.
- Model output is parsed and validated before it is persisted.
- Journal content is excluded from application logs.

Read [the AI Studio constitution](docs/AI_STUDIO_SECURITY_CONSTITUTION.md), [threat model](docs/THREAT_MODEL.md), and [architecture](docs/ARCHITECTURE.md) before changing the system.

## Local setup

1. Create a Firebase project attached to Google Cloud project `gen-lang-client-0509152597`.
2. Enable Google Authentication and create a Firestore database.
3. Copy `.env.example` to `.env.local` and fill only local development values.
4. Use Application Default Credentials for Firebase Admin and Secret Manager.
5. Run `npm install`, then `npm run dev`.

Never commit `.env.local`, API keys, or service-account JSON files.

## Verification

```bash
npm run typecheck
npm run test
npm run build
```

Firestore isolation tests require the Firebase emulator:

```bash
npm run test:rules
```

## Cloud Run

The included `Dockerfile` builds a non-root production image. Deployment instructions and required IAM roles are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Challenge evidence

The submission should demonstrate two separately authenticated users and an attempted cross-user document read that is rejected. See [docs/DEMO.md](docs/DEMO.md).

## Hackathon

#AccelerateAIwithCloudRun #Gemini #Firebase #GoogleCloud #CloudRun #BuildWithAI #Hackathon
