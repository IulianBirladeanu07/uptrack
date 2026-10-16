const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require("@firebase/rules-unit-testing");

const projectId = "demo-uptrack-rules";
const testEnvPromise = initializeTestEnvironment({
  projectId,
  firestore: {
    rules: readFileSync(path.join(__dirname, "../../firebase/firestore.rules"), "utf8"),
  },
  storage: {
    rules: readFileSync(path.join(__dirname, "../../firebase/storage.rules"), "utf8"),
  },
});

let testEnv;

before(async () => {
  testEnv = await testEnvPromise;
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test("user documents are accessible only by the matching authenticated user", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const signedOut = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(alice.doc("users/alice").set({ displayName: "Alice" }));
  await assertSucceeds(alice.doc("users/alice").get());
  await assertFails(bob.doc("users/alice").get());
  await assertFails(bob.doc("users/alice").set({ displayName: "Changed" }));
  await assertFails(signedOut.doc("users/alice").get());
});

test("meal access, list queries, and writes stay scoped to the user's day documents", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const mealPath = "meals/alice_2026-10-16";
  const meal = alice.doc(mealPath);

  await assertSucceeds(meal.set({ uid: "alice", date: "2026-10-16", items: [] }));
  await assertSucceeds(meal.get());
  await assertSucceeds(meal.update({ items: [{ name: "Oats" }] }));
  await assertFails(meal.update({ date: "2026-10-17" }));
  await assertFails(meal.update({ uid: "bob" }));
  await assertFails(bob.doc(mealPath).get());
  await assertSucceeds(bob.doc("meals/bob_2026-10-16").set({
    uid: "bob",
    date: "2026-10-16",
  }));
  await assertFails(alice.doc("meals/alice_2026-10-17").set({
    uid: "alice",
    date: "2026-10-16",
  }));

  await assertSucceeds(alice.collection("meals").where("uid", "==", "alice").get());
  await assertFails(alice.collection("meals").get());
  await assertSucceeds(meal.delete());
});

test("user-owned workout, measurement, split, template, and custom exercise records enforce ownership", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  const bob = testEnv.authenticatedContext("bob").firestore();
  const ownedDocs = [
    ["workoutHistory/workout-1", { uid: "alice", date: "2026-10-16" }],
    ["measurements/measurement-1", { uid: "alice", weight: 70 }],
    ["workoutTemplates/push_alice", { uid: "alice", name: "Push" }],
    ["workoutSplits/split-1", { uid: "alice", name: "Upper Lower" }],
    ["customExercises/exercise-1", { uid: "alice", name: "Cable Row" }],
  ];

  for (const [documentPath, data] of ownedDocs) {
    await assertSucceeds(alice.doc(documentPath).set(data));
    await assertSucceeds(alice.doc(documentPath).get());
    await assertFails(bob.doc(documentPath).get());
    await assertFails(bob.doc(documentPath).delete());
  }

  await assertSucceeds(alice.doc("workoutSplits/split-1").update({ name: "Updated" }));
  await assertFails(alice.doc("workoutSplits/split-1").update({ uid: "bob" }));
  await assertSucceeds(alice.doc("workoutTemplates/push_alice").update({ name: "Updated" }));
  await assertFails(alice.doc("workoutTemplates/push_alice").update({ uid: "bob" }));
  await assertFails(alice.doc("workoutTemplates/invalid-id").set({ uid: "alice" }));
  await assertSucceeds(alice.doc("customExercises/exercise-1").update({ name: "Changed" }));
  await assertFails(alice.doc("customExercises/exercise-1").update({ uid: "bob" }));
  await assertFails(alice.doc("workoutHistory/workout-1").update({ note: "Changed" }));
  await assertFails(alice.doc("measurements/measurement-1").update({ weight: 71 }));

  await assertSucceeds(alice.collection("measurements").where("uid", "==", "alice").get());
  await assertFails(alice.collection("measurements").get());
});

test("shared exercises are readable by signed-in users and never writable from clients", async () => {
  const alice = testEnv.authenticatedContext("alice").firestore();
  const signedOut = testEnv.unauthenticatedContext().firestore();
  const exercise = alice.doc("exercises/chest");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc("exercises/chest").set({ name: "Chest exercises" });
  });

  await assertSucceeds(exercise.get());
  await assertFails(signedOut.doc("exercises/chest").get());
  await assertFails(exercise.set({ name: "Overwritten" }));
  await assertFails(exercise.delete());
});

test("profile pictures are restricted to the owner's JPG and valid image uploads", async () => {
  const alice = testEnv.authenticatedContext("alice").storage();
  const bob = testEnv.authenticatedContext("bob").storage();
  const signedOut = testEnv.unauthenticatedContext().storage();
  const profilePicture = alice.ref("profilePictures/alice.jpg");
  const image = Buffer.from("profile-image").toString("base64");

  await assertSucceeds(profilePicture.putString(image, "base64", {
    contentType: "image/jpeg",
  }));
  await assertSucceeds(profilePicture.getMetadata());
  await assertFails(bob.ref("profilePictures/alice.jpg").getMetadata());
  await assertFails(signedOut.ref("profilePictures/alice.jpg").getMetadata());
  await assertSucceeds(bob.ref("profilePictures/bob.jpg").putString(image, "base64", {
    contentType: "image/jpeg",
  }));
  await assertFails(alice.ref("profilePictures/bob.jpg").putString(image, "base64", {
    contentType: "image/jpeg",
  }));
  await assertFails(alice.ref("profilePictures/alice.png").putString(image, "base64", {
    contentType: "image/png",
  }));
  await assertFails(alice.ref("profilePictures/alice.jpg").putString(image, "base64", {
    contentType: "text/plain",
  }));

  const oversizedImage = Buffer.alloc(5 * 1024 * 1024).toString("base64");
  await assertFails(profilePicture.putString(oversizedImage, "base64", {
    contentType: "image/jpeg",
  }));
  await assertSucceeds(profilePicture.delete());
});

test("catalog images are public-read only", async () => {
  const signedOut = testEnv.unauthenticatedContext().storage();
  const publicImage = signedOut.ref("nutrition_images/oats.png");
  const image = Buffer.from("catalog-image").toString("base64");

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.storage().ref("nutrition_images/oats.png").putString(image, "base64", {
      contentType: "image/png",
    });
  });

  await assertSucceeds(publicImage.getMetadata());
  await assertFails(publicImage.putString(image, "base64", {
    contentType: "image/png",
  }));
  await assertFails(signedOut.ref("unlisted/file.png").getMetadata());
});
