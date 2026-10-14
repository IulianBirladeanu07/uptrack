import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { DailySteps } from '../../types';

export type StepDisplayHandle = {
  retry: () => void;
};

export type StepDisplayProps = {
  onStepsUpdate?: (steps: number, dateKey: string) => void;
  onStepsHistory?: (entries: DailySteps) => void;
  onStepsError?: (errorCode: string) => void;
  onStepsLoading?: (isLoading: boolean) => void;
  onConnectedChange?: (connected: boolean) => void;
};

declare const StepDisplay: ForwardRefExoticComponent<StepDisplayProps & RefAttributes<StepDisplayHandle>>;

export default StepDisplay;
