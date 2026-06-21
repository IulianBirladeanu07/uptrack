import React, { useContext, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/features/auth/context/AuthContext';
import { FoodProvider } from './src/features/nutrition/context/FoodContext';
import { WorkoutProvider } from './src/features/workout/context/WorkoutContext';

import WorkoutScreen from './src/features/workout/screens/WorkoutScreen/WorkoutScreen';
import LoginScreen from './src/features/auth/components/LoginScreen/LoginScreen';
import RegistrationScreen from './src/features/auth/components/RegistrationScreen/RegistrationScreen';
import DashboardScreen from './src/features/dashboard/screens/DashboardScreen/DashboardScreen';
import NutritionScreen from './src/features/nutrition/screens/NutritionScreen/NutritionScreen';
import ProgressScreen from './src/features/progress/screens/ProgressScreen/ProgressScreen';
import SettingsScreen from './src/features/profile/components/Settings/SettingsScreen';
import ProfileScreen from './src/features/profile/components/Profile/ProfileScreen';
import WorkoutHistory from './src/features/workout/screens/WorkoutHistoryScreen/WorkoutHistory';
import WorkoutDetails from './src/features/workout/screens/WorkoutDetailsScreen/WorkoutDetails';
import StartWorkout from './src/features/workout/screens/StartWorkoutScreen/StartWorkout';
import ExerciseSelectionScreen from './src/features/workout/screens/ExerciseSelectionScreen/ExerciseSelectionScreen';
import WorkoutLibraryScreen from './src/features/workout/screens/WorkoutLibraryScreen/WorkoutLibraryScreen';
import CreateTemplateScreen from './src/features/workout/screens/CreateTemplateScreen/CreateTemplateScreen';
import FoodSelectionScreen from './src/features/nutrition/screens/FoodSelectionScreen/FoodSelectionScreen';
import FoodDetailScreen from './src/features/nutrition/screens/FoodDetailScreen/FoodDetailScreen';
import SplashScreen from './src/shared/components/SplashScreen/SplashScreen';
import ChangePasswordScreen from './src/features/auth/components/ChangePasswordScreen/ChangePasswordScreen';
import FitnessProfileSetup from './src/features/profile/components/ProfileSetup/FitnessProfileSetup';
import ForgotPasswordScreen from './src/features/auth/components/ForgotPasswordScreen/ForgotPasswordScreen';
import CustomFoodScreen from './src/features/nutrition/screens/FoodSelectionScreen/CustomFoodScreen';
import BarcodeScannerScreen from './src/features/nutrition/screens/BarcodeScannerScreen/BarcodeScannerScreen';
import CreateSplitScreen from './src/features/workout/screens/CreateSplitScreen/CreateSplitScreen'; 
import WeightTracker from './src/features/nutrition/components/WeightTracker/WeightTracker';
import ViewSplitScreen from './src/features/workout/screens/CreateSplitScreen/components/ViewSplitScreen';
import CreateExerciseScreen from './src/features/workout/screens/CreateExerciseScreen/CreateExerciseScreen';
import WeightHistoryScreen from './src/features/nutrition/components/WeightTracker/WeightHistoryScreen';
import ExerciseHistoryScreen from './src/features/workout/components/ExerciseHistoryScreen/ExerciseHistoryScreen';

const Stack = createNativeStackNavigator();

const AuthenticatedScreens = React.memo(() => (
  <FoodProvider>
    <WorkoutProvider>
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Workout" component={WorkoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CustomFood" component={CustomFoodScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutHistory" component={WorkoutHistory} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutDetails" component={WorkoutDetails} options={{ headerShown: false }} />
        <Stack.Screen name="StartWorkout" component={StartWorkout} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseSelection" component={ExerciseSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateTemplate" component={CreateTemplateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FoodSelection" component={FoodSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateSplit" component={CreateSplitScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WeightTracker" component={WeightTracker} options={{ headerShown: false }} />
        <Stack.Screen name="ViewSplit" component={ViewSplitScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} options={{ headerShown: false }} />
        <Stack.Screen name="WeightHistory" component={WeightHistoryScreen} options= {{ headerShown: false}} />
        <Stack.Screen name="ExerciseHistory" component={ExerciseHistoryScreen} options= {{ headerShown: false}} />
      </Stack.Navigator>
    </WorkoutProvider>
  </FoodProvider>
));

const MainApp = () => {
  const { authenticated, loading, profileSetupComplete } = useContext(AuthContext);
  
  const routes = useMemo(() => {
    if (loading) {
      return (
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
      );
    }

    if (!authenticated) {
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Registration" component={RegistrationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      );
    }
    if (profileSetupComplete) {
      return (
        <Stack.Screen
          name="AuthenticatedScreens"
          component={AuthenticatedScreens}
          options={{ headerShown: false }}
        />
      );
    }
    return (
      <Stack.Screen
        name="FitnessProfileSetup"
        component={FitnessProfileSetup}
        options={{ headerShown: false }}
      />
    );
  }, [authenticated, loading, profileSetupComplete]);

  return <Stack.Navigator>{routes}</Stack.Navigator>;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}