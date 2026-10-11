import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  AuthenticatedStackParamList,
  RootStackParamList,
} from './types';

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AuthenticatedStackParamList>;

export const useRootNavigation = () =>
  useNavigation<RootNavigationProp>();

export const useAppNavigation = () =>
  useNavigation<AppNavigationProp>();

export const useRootRoute = <T extends keyof RootStackParamList>() =>
  useRoute<RouteProp<RootStackParamList, T>>();

export const useAppRoute = <T extends keyof AuthenticatedStackParamList>() =>
  useRoute<RouteProp<AuthenticatedStackParamList, T>>();
