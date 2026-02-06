import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

export const useLearningCompletion = (learningData, hasTargets) => {
  const [wasInLearning, setWasInLearning] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!hasTargets && learningData?.daysLogged > 0) {
      setWasInLearning(true);
    }

    if (wasInLearning && hasTargets && !justCompleted) {
      setJustCompleted(true);
      
      Alert.alert(
        "Learning Complete! 🎉",
        `Based on your 7 days of logging, we've set your daily targets:\n\n` +
        `• Calories: ${Math.round(learningData?.weeklyAvgCalories || 0)}\n` +
        `• Personalized macro goals\n\n` +
        `You can adjust these in Settings anytime.`,
        [
          {
            text: "Got it!",
            style: "default",
            onPress: () => {
              setTimeout(() => setJustCompleted(false), 1000);
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, [hasTargets, learningData, wasInLearning, justCompleted]);

  useEffect(() => {
    if (!hasTargets) {
      setJustCompleted(false);
      setWasInLearning(false);
    }
  }, [hasTargets]);

  return {
    isLearning: !hasTargets && (learningData?.daysLogged || 0) < 7,
    isComplete: hasTargets,
    justCompleted,
    daysRemaining: Math.max(0, 7 - (learningData?.daysLogged || 0)),
    progress: Math.min(100, ((learningData?.daysLogged || 0) / 7) * 100)
  };
};

export default useLearningCompletion;