import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import FoodListItem from './FoodListItem';

describe('FoodListItem recent searches', () => {
  it('delegates a recent search to the parent once', () => {
    const onRecentSearchPress = jest.fn();
    const setSearchQuery = jest.fn();
    const handleSearch = jest.fn();

    render(
      <FoodListItem
        isSearching
        recentSearches={['oats']}
        onRecentSearchPress={onRecentSearchPress}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Search for oats' }));

    expect(onRecentSearchPress).toHaveBeenCalledTimes(1);
    expect(onRecentSearchPress).toHaveBeenCalledWith('oats');
    expect(setSearchQuery).not.toHaveBeenCalled();
    expect(handleSearch).not.toHaveBeenCalled();
  });
});
