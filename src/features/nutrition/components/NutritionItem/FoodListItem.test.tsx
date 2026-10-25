import React from 'react';
import { FlatList } from 'react-native';
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

describe('FoodListItem list layout', () => {
  it.each(['Frequent', 'Recent'])('%s uses measured row layouts', category => {
    const view = render(
      <FoodListItem
        selectedCategory={category}
        categoryFoods={[]}
      />,
    );

    expect(view.UNSAFE_getByType(FlatList).props.getItemLayout).toBeUndefined();
  });

});
