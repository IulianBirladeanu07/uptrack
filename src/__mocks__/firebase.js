// const firebasemock = require('firebase-mock');

// // Create a mock Firestore database
// const mockFirestore = new firebasemock.MockFirestore();
// mockFirestore.autoFlush();

// // Create a mock Auth service
// const mockAuth = new firebasemock.MockFirebase();
// mockAuth.autoFlush();

// // Create a mock SDK
// const mockSdk = new firebasemock.MockFirebaseSdk(
//   null,
//   () => mockFirestore,
//   () => mockAuth
// );

// mockSdk.initializeApp = jest.fn(() => ({
//   firestore: () => mockFirestore,
//   auth: () => mockAuth,
// }));

// module.exports = mockSdk;
