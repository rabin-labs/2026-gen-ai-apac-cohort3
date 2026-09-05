import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";
import { readFileSync } from "node:fs";

let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "private-compass-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 }
  });
});
afterAll(async () => env.cleanup());

describe("Firestore tenant isolation", () => {
  it("allows an owner to create and read a decision", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const own = doc(db, "users/alice/decisions/decision-1");
    await assertSucceeds(setDoc(own, { title: "Private decision" }));
    await assertSucceeds(getDoc(own));
  });

  it("denies cross-user reads, writes and deletes", async () => {
    const bob = env.authenticatedContext("bob").firestore();
    const aliceDecision = doc(bob, "users/alice/decisions/decision-1");
    await assertFails(getDoc(aliceDecision));
    await assertFails(setDoc(aliceDecision, { title: "Changed" }));
    await assertFails(deleteDoc(aliceDecision));
  });

  it("denies unauthenticated access", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "users/alice/decisions/decision-1")));
  });
});
