export default {
  expo: {
    name: "uptrack",
    slug: "uptrack",
    platforms: ["ios", "android"],
    version: "2.0.4",
    orientation: "portrait",
    icon: "./assets/uptrack-icon.png",
    userInterfaceStyle: "light",
    plugins: [
      "expo-font",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true,
            minSdkVersion: 26,
            hermesVersion: "0.12.0"
          },
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    sdkVersion: "54.0.0",
    splash: {
      image: "./assets/uptrack-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      jsEngine: "hermes",
      supportsTablet: true,
      infoPlist: {
        CFBundleDisplayName: "UpTrack",
        NSCameraUsageDescription: "This app uses the camera to scan barcodes.",
        NSHealthUpdateUsageDescription: "This app reads your health data to track activity and steps.",
        NSHealthShareUsageDescription: "This app requires access to your health data to display your activity progress.",
      },
      bundleIdentifier: "com.iulianbirladeanu.uptrack",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST,
    },
    android: {
      jsEngine: "hermes",
      permissions: ["CAMERA", "ACTIVITY_RECOGNITION"],
      adaptiveIcon: {
        foregroundImage: "./assets/uptrack-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.iulianbirladeanu.uptrack",
      versionCode: 2,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      favicon: "./assets/uptrack-icon.png",
    },
    scheme: "com.iulianbirladeanu.uptrack",
    extra: {
      eas: {
        projectId: "2512a7a0-ae42-4736-9b5a-03ce8ad42d13",
      },
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      firebaseStorageURL: process.env.FIREBASE_STORAGE_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      defaultFoodIconUri: process.env.DEFAULT_FOOD_ICON_URI,
      googleRedirectUri: "com.iulianbirladeanu.uptrack://auth",
      expo: {
        doctor: {
          reactNativeDirectoryCheck: {
            exclude: ["lucide-react-native", "react-native-google-fit"],
            listUnknownPackages: false,
          },
        },
      },
    },
    owner: "iulian_birladeanu",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/2512a7a0-ae42-4736-9b5a-03ce8ad42d13",
    },
    newArchEnabled: true,
  },
};