export default {
  expo: {
    name: "uptrack",
    slug: "uptrack",
    platforms: ["ios", "android"],
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/uptrack-icon.png",
    userInterfaceStyle: "light",
    plugins: [
      "expo-secure-store",
      "expo-font",
      [
        "react-native-permissions",
        {
          iosPermissions: {
            camera: "This app uses the camera to scan barcodes.",
            microphone: "This app requires microphone access.",
            location: "This app uses your location to provide location-based features.",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "newArchEnabled": true,
            "minSdkVersion": 26
          },
          ios: {
            useFrameworks: "static",
          },
        },
      ],
    ],
    "sdkVersion": "54.0.0",
    splash: {
      image: "./assets/uptrack-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "This app uses the camera to scan barcodes.",
        NSMicrophoneUsageDescription: "This app requires microphone access.",
        NSLocationWhenInUseUsageDescription: "This app uses your location to provide location-based features.",
        NSHealthUpdateUsageDescription: "This app reads your health data to track activity and steps.",
        NSHealthShareUsageDescription: "This app requires access to your health data to display your activity progress.",
      },
      bundleIdentifier: "com.iulianbirladeanu.activerecovery",
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST,
    },
    android: {
      permissions: ["CAMERA", "ACCESS_FINE_LOCATION", "ACTIVITY_RECOGNITION"],
      adaptiveIcon: {
        foregroundImage: "./assets/uptrack-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.iulianbirladeanu.activerecovery",
      versionCode: 2,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
    },
    web: {
      favicon: "./assets/uptrack-icon.png",
    },
    scheme: "com.iulianbirladeanu.activerecovery",
    extra: {
      eas: {
        projectId: "10e8fbd0-5cc8-488e-8605-6a4e8d5817b0",
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
      googleRedirectUri: "com.iulianbirladeanu.activerecovery://auth",
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
    cli: {
      appVersionSource: "2.0",
    },
    updates: {
      url: "https://u.expo.dev/10e8fbd0-5cc8-488e-8605-6a4e8d5817b0",
    },
    newArchEnabled: true,
  },
};