import { fireEvent, render, screen } from '@testing-library/react-native';
import SearchBar from './SearchBar';

jest.mock('../../../../shared/navigation/hooks', () => ({
  useAppNavigation: () => ({ navigate: jest.fn() }),
}));

describe('SearchBar search actions', () => {
  it('uses the leading back control to exit search and keeps clear separate', () => {
    const onClear = jest.fn();
    render(
      <SearchBar
        searchQuery="oats"
        setSearchQuery={jest.fn()}
        onClear={onClear}
        isSearching
      />,
    );

    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Cancel search' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
