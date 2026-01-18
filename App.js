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
import MeasurementScreen from './src/features/profile/screens/MeasurementsScreen/MeasurementsScreen';
import StartWorkout from './src/features/workout/screens/StartWorkoutScreen/StartWorkout';
import ExerciseSelectionScreen from './src/features/workout/screens/ExerciseSelectionScreen/ExerciseSelectionScreen';
import WorkoutLibraryScreen from './src/features/workout/screens/WorkoutLibraryScreen/WorkoutLibraryScreen';
import CreateWorkout from './src/features/workout/screens/CreateWorkoutScreen/CreateWorkoutScreen';
import FoodSelectionScreen from './src/features/nutrition/screens/FoodSelectionScreen/FoodSelectionScreen';
import FoodDetailScreen from './src/features/nutrition/screens/FoodDetailScreen/FoodDetailScreen';
import SplashScreen from './src/shared/components/SplashScreen/SplashScreen';
import ChangePasswordScreen from './src/features/auth/components/ChangePassword/ChangePasswordScreen';
import FitnessProfileSetup from './src/features/profile/components/ProfileSetup/FitnessProfileSetup';
import ForgotPasswordScreen from './src/features/auth/components/ForgotPassword/ForgotPassword';
import CustomFoodScreen from './src/features/nutrition/screens/FoodSelectionScreen/CustomFoodScreen';
import BarcodeScannerScreen from './src/features/nutrition/screens/BarcodeScannerScreen/BarcodeScannerScreen';
import CreateSplitScreen from './src/features/workout/screens/CreateSplitScreen/CreateSplitScreen'; 
import WeightTracker from './src/features/nutrition/components/WeightTracker/WeightTracker';
import ViewSplitScreen from './src/features/workout/screens/CreateSplitScreen/components/ViewSplitScreen';
import CreateExerciseScreen from './src/features/workout/screens/CreateExerciseScreen/CreateExerciseScreen';
import ExerciseHistory from './src/features/workout/components/ExerciseInput/ExerciseHistory';

const Stack = createNativeStackNavigator();

const AuthenticatedScreens = React.memo(() => (
  <FoodProvider>
    <WorkoutProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0A0E13' },
          contentStyle: { backgroundColor: '#0A0E13' },
          animation: 'fade',
          animationDuration: 180,
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} />
        <Stack.Screen name="Progress" component={ProgressScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="CustomFood" component={CustomFoodScreen} />
        <Stack.Screen name="WorkoutHistory" component={WorkoutHistory} />
        <Stack.Screen name="WorkoutDetails" component={WorkoutDetails} />
        <Stack.Screen name="Measurements" component={MeasurementScreen} />
        
        <Stack.Screen 
          name="StartWorkout" 
          component={StartWorkout} 
          options={{ 
            presentation: 'card',
            gestureEnabled: false,
            animation: 'simple_push',
          }} 
        />
        
        <Stack.Screen name="ExerciseSelection" component={ExerciseSelectionScreen} />
        <Stack.Screen name="ExerciseHistory" component={ExerciseHistory} />
        <Stack.Screen name="WorkoutLibrary" component={WorkoutLibraryScreen} />
        <Stack.Screen name="CreateWorkout" component={CreateWorkout} />
        <Stack.Screen name="FoodSelection" component={FoodSelectionScreen} />
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
        <Stack.Screen name="CreateSplit" component={CreateSplitScreen} />
        <Stack.Screen name="WeightTracker" component={WeightTracker} />
        <Stack.Screen name="ViewSplit" component={ViewSplitScreen} />
        <Stack.Screen name="CreateExercise" component={CreateExerciseScreen} />
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