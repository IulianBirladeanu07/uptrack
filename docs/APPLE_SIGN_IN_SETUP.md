# Sign in with Apple setup

The app implements native Sign in with Apple on iOS and exchanges Apple's ID token with Firebase Authentication. The Apple provider must be configured in both the Apple Developer account and Firebase before the button can complete sign-in.

## Apple Developer configuration

1. An active Apple Developer Program membership is required.
2. Enable **Sign in with Apple** for the app identifier `com.iulianbirladeanu.uptrack`.
3. Create a Services ID for Firebase's OAuth flow. Configure its primary App ID and register:
   - Domain: `activerecovery-3a400.firebaseapp.com`
   - Return URL: `https://activerecovery-3a400.firebaseapp.com/__/auth/handler`
4. Create a Sign in with Apple private key. Record the Services ID, Team ID, and Key ID; upload the private key only to Firebase Authentication settings.
5. In Apple's private email relay settings, register `noreply@activerecovery-3a400.firebaseapp.com` if Firebase Auth emails need to reach users who choose Hide My Email.

Never put the Apple private key in the app, repository, or Expo public configuration.

## Firebase configuration

In Firebase Console for `activerecovery-3a400`:

1. Open **Authentication → Sign-in method → Apple** and enable the provider.
2. Enter the Apple Services ID, Team ID, Key ID, and private key in the OAuth code flow configuration.
3. Save and verify the Firebase handler URL above is registered with Apple.

## iOS build and testing

`app.config.js` enables the Apple sign-in entitlement using `ios.usesAppleSignIn` and the Expo config plugin. Create a new iOS development/production build after enabling the Apple capability so its provisioning profile includes the entitlement. Test on a real iOS device with:

- A new Apple account, including the first-time name/email consent.
- A returning Apple account, where Apple may omit the name and email.
- Hide My Email / private relay.
- Cancellation and an account whose email already uses another sign-in provider.

The Apple button is intentionally iOS-only. Android and other platforms retain their existing sign-in options.
