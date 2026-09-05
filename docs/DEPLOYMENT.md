# Cloud Run Deployment

Target project: `gen-lang-client-0509152597` (`133701402785`)

Recommended Cloud Run region: `asia-southeast1`.

## Required Google Cloud setup

1. Add Firebase to the existing Google Cloud project.
2. Enable Google sign-in in Firebase Authentication.
3. Create Firestore in Native mode in an available Asia region. Database location cannot be changed later.
4. Enable Cloud Run, Artifact Registry, Cloud Build, Secret Manager, and required Firebase APIs.
5. Create a dedicated Cloud Run service account.
6. Grant it only Firestore access required by the application and `roles/secretmanager.secretAccessor` on the single Gemini secret.
7. Create `gemini-api-key` in Secret Manager and add the credential as a secret version.
8. Configure Cloud Run with non-secret environment variables from `.env.example` and runtime access to the secret.
9. Add the Cloud Run domain to Firebase Authentication authorized domains.
10. Deploy `firestore.rules` and run the two-user isolation tests before public access.

Do not use the default broad Compute Engine service account for the running service. Do not put secret values in Docker build arguments, Cloud Build substitutions, GitHub Actions logs, or source files.

## Production gates

- Replace instance-local rate limiting with a distributed control.
- Enable Firebase App Check enforcement after monitoring legitimate traffic.
- Configure minimum instances and budget alerts.
- Create log-based alerts using metadata only.
- Complete data export, account deletion, privacy notice, and retention policy.
- Run dependency, container, and secret scans in CI.

## Cloud Build

`cloudbuild.yaml` passes only the public Firebase web configuration into the Next.js build. The Gemini API key is deliberately absent: the running container retrieves it from Secret Manager using its attached service account.
