import React from 'react';
import { render } from '../../../__tests__/testUtils';
import CustomButton from '../CustomButton';

describe('CustomButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with title', () => {
    const { getByText } = render(
      <CustomButton 
        title="Press me" 
        onPress={mockOnPress}
      />
    );
    
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = render(
      <CustomButton 
        title="Submit" 
        onPress={mockOnPress}
        testID="custom-btn"
      />
    );
    
    getByTestId('custom-btn');
  });

  it('disables button when disabled prop is true', () => {
    const { getByTestId } = render(
      <CustomButton 
        title="Disabled" 
        onPress={mockOnPress}
        disabled={true}
        testID="disabled-btn"
      />
    );
    
    expect(getByTestId('disabled-btn')).toBeDisabled();
  });

  it('renders with custom styling', () => {
    const { getByText } = render(
      <CustomButton 
        title="Styled" 
        onPress={mockOnPress}
        buttonStyle={{ backgroundColor: 'red' }}
      />
    );
    
    expect(getByText('Styled')).toBeTruthy();
  });

  it('shows loading state when loading prop is true', () => {
    const { getByTestId } = render(
      <CustomButton 
        title="Loading" 
        onPress={mockOnPress}
        loading={true}
        testID="loading-btn"
      />
    );
    
    expect(getByTestId('loading-btn')).toBeTruthy();
  });
});
