import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import StartWorkout from './StartWorkout'; // Adjust the import path as necessary
import { WorkoutContext } from './features/workout/context/WorkoutContext';
import { sendWorkoutDataToFirestore, getSetsFromLastWorkout } from '../handlers/WorkoutHandler';
import { Alert, AppState } from 'react-native';

// Mocking external dependencies and context
jest.mock('../handlers/WorkoutHandler', () => ({
  sendWorkoutDataToFirestore: jest.fn(),
  getSetsFromLastWorkout: jest.fn(),
  handleAddExercises: jest.fn(),
  handleInputChange: jest.fn(),
  handleWeightChange: jest.fn(),
  handleRepsChange: jest.fn(),
  handleValidation: jest.fn(),
}));

// Mock only the necessary parts of react-native
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    AppState: {
      ...actualRN.AppState,
      addEventListener: jest.fn(),
      currentState: 'active',
    },
  };
});

jest.useFakeTimers(); // To mock the timers in the tests

describe('StartWorkout Component', () => {
  const navigation = { goBack: jest.fn() };
  const route = { params: {} };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock functions before each test
  });

  // Test initial component render
  it('should render the component correctly', () => {
    const { toJSON } = render(<StartWorkout route={route} navigation={navigation} />);
    expect(toJSON()).toMatchSnapshot();
  });

  // Test if the timer starts and updates correctly
  it('should start the timer and update every second', () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);

    fireEvent.press(getByText('Start Timer'));
    jest.advanceTimersByTime(5000); // Advance 5 seconds
    expect(getByText('0:05')).toBeTruthy(); // Check timer after 5 seconds

    fireEvent.press(getByText('Stop Timer')); // Stop the timer
    jest.advanceTimersByTime(5000); // Timer should not update
    expect(getByText('0:05')).toBeTruthy(); // Timer still 5 seconds
  });

  // Test if the timer pauses when the app goes to background and resumes when it comes back
  it('should pause the timer when the app goes to background and resume when it comes back to the foreground', async () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Start Timer'));
    jest.advanceTimersByTime(5000); // Timer runs for 5 seconds
    
    expect(getByText('0:05')).toBeTruthy(); // Timer should show 5 seconds
    
    // Simulate app going to background
    fireEvent(AppState, 'change', 'background');
    
    // Timer should not change
    jest.advanceTimersByTime(1000); // 1 second later
    expect(getByText('0:05')).toBeTruthy();
    
    // Simulate app coming back to foreground
    fireEvent(AppState, 'change', 'active');
    
    // Timer should resume and show 6 seconds
    jest.advanceTimersByTime(1000);
    expect(getByText('0:06')).toBeTruthy();
  });

  // Test if new exercises can be added
  it('should add new exercises to the workout', () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Add Exercises')); // Simulate adding exercises
    expect(getByText('Add Exercise')).toBeTruthy(); // Check if the button or prompt to add exercises shows up
  });

  // Test if workout note input changes correctly
  it('should update workout note input', () => {
    const { getByPlaceholderText } = render(<StartWorkout route={route} navigation={navigation} />);
    const noteInput = getByPlaceholderText('Note');
    
    fireEvent.changeText(noteInput, 'My workout note');
    expect(noteInput.props.value).toBe('My workout note');
  });

  // Test if cancel button prompts exit confirmation
  it('should show exit confirmation when pressing the cancel button', async () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Cancel'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Hold on!',
        'Are you sure you want to go back?',
        expect.anything() // We can check for the presence of cancel and confirm actions here
      );
    });
  });

  // Test if user can exit workout
  it('should confirm exit and navigate back when user confirms exit', () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Cancel')); // Open exit confirmation
    fireEvent.press(getByText('YES')); // Simulate confirming exit
    
    expect(navigation.goBack).toHaveBeenCalled(); // Ensure navigation happens on exit
  });

  // Test sending workout data when finishing the workout
  it('should send workout data to Firestore when workout is finished', async () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Finish')); // Finish workout
    
    await waitFor(() => {
      expect(sendWorkoutDataToFirestore).toHaveBeenCalledWith(
        expect.any(Array), // Exercise data (mocked)
        expect.any(String), // Input text (mocked)
        expect.any(Boolean), // Validation state
        expect.anything(), // Navigation function
        expect.any(Function), // Animation function
        expect.any(Function), // Time formatting function
        expect.any(Number) // Time elapsed
      );
    });
  });

  // Test deleting exercise set
  it('should delete an exercise set when swipe delete is triggered', () => {
    const exerciseData = [{ exerciseName: 'Push-up', sets: [{ weight: '10', reps: '12' }] }];
    
    const { getByText } = render(
      <WorkoutContext.Provider value={{ refreshAllData: jest.fn() }}>
        <StartWorkout route={{}} navigation={navigation} />
      </WorkoutContext.Provider>
    );
    
    // Assuming the component has a delete swipe action
    fireEvent.press(getByText('Delete Exercise Set')); // Trigger swipe delete or delete button
    
    expect(exerciseData[0].sets.length).toBe(0); // Ensure the set was deleted
  });

  // Test workout completion with empty exercise data
  it('should handle empty exercise data when finishing the workout', async () => {
    const sendWorkoutDataToFirestore = jest.fn().mockResolvedValue(true);
    
    const { getByText } = render(
      <WorkoutContext.Provider value={{ refreshAllData: jest.fn() }}>
        <StartWorkout route={{}} navigation={navigation} />
      </WorkoutContext.Provider>
    );
    
    fireEvent.press(getByText('Finish')); // Finish workout with no exercises
    
    await waitFor(() => {
      expect(sendWorkoutDataToFirestore).toHaveBeenCalledWith(
        [], // No exercises
        '', // Empty note
        false, // No validation
        expect.anything(), // Navigation function
        expect.any(Function), // Animation function
        expect.any(Function), // Time formatting function
        expect.any(Number) // Time elapsed
      );
    });
  });

  // Test validation button behavior
  it('should toggle validation state when pressing the validate button', () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Validate'));
    expect(getByText('Validated')).toBeTruthy();
  });

  // Test if data updates after app state change
  it('should update elapsed time after app state change', async () => {
    const { getByText } = render(<StartWorkout route={route} navigation={navigation} />);
    
    fireEvent.press(getByText('Start Timer'));
    jest.advanceTimersByTime(3000); // 3 seconds
    expect(getByText('0:03')).toBeTruthy(); // Timer shows 3 seconds
    
    // Simulate background state
    fireEvent(AppState, 'change', 'background');
    jest.advanceTimersByTime(1000); // 1 second more, timer should not update
    expect(getByText('0:03')).toBeTruthy(); // Still 3 seconds
    
    // Simulate active state
    fireEvent(AppState, 'change', 'active');
    jest.advanceTimersByTime(2000); // Timer should resume
    expect(getByText('0:05')).toBeTruthy(); // Timer should show 5 seconds
  });
});
