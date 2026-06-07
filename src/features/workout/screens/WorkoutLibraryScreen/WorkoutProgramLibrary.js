import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, Alert } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { deleteSplitFromFirestore } from '../../handlers/WorkoutHandler';
import ProgramItem from './components/ProgramItem';
import EmptyState from './components/EmptyState';

const WorkoutProgramLibrary = ({ 
  splits, 
  activeSplitId, 
  navigation, 
  refreshControl, 
  onCreateSplit, 
  onActivateSplit 
}) => {
  const [expandedCards, setExpandedCards] = useState({});

  const handleEditSplit = useCallback((split) => {
    navigation.navigate('CreateSplit', { 
      split: split,
      isEditing: true,
      returnScreen: 'WorkoutLibrary'
    }); 
  }, [navigation]);

  const handleViewSchedule = useCallback((split) => {
    navigation.navigate('ViewSplit', { splitData: split });
  }, [navigation]);

  const handleDeleteSplit = useCallback(async (split) => {
    const name = split.name || split.templateName || 'Split';
    Alert.alert(
      'Delete Split',
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSplitFromFirestore(split.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete split.');
            }
          }
        }
      ]
    );
  }, []);

  const toggleExpanded = useCallback((id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const displaySplits = useMemo(() => {
    if (!activeSplitId) return splits;
    return [...splits.filter(split => split.id === activeSplitId), ...splits.filter(split => split.id !== activeSplitId)];
  }, [splits, activeSplitId]);

  const renderItem = useCallback(({ item }) => (
    <ProgramItem
      item={item}
      expandedCards={expandedCards}
      onToggleExpanded={toggleExpanded}
      onEdit={handleEditSplit}
      onActivate={onActivateSplit}
      onViewSchedule={handleViewSchedule}
      onDelete={handleDeleteSplit}
      isActive={item.id === activeSplitId}
    />
  ), [expandedCards, toggleExpanded, handleEditSplit, onActivateSplit, handleViewSchedule, handleDeleteSplit, activeSplitId]);

  const keyExtractor = useCallback((item, index) => item.id || `split-${index}`, []);

  const flatListProps = useMemo(() => ({
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { paddingBottom: normalize(100), paddingHorizontal: normalize(18), paddingTop: normalize(18) },
    removeClippedSubviews: true,
    initialNumToRender: 5,
    maxToRenderPerBatch: 5,
    windowSize: 10,
    updateCellsBatchingPeriod: 100,
    getItemLayout: (data, index) => ({
      length: normalize(300), 
      offset: normalize(300) * index,
      index,
    }),
  }), []);

  return (
    <FlatList
      data={displaySplits}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={refreshControl}
      ListEmptyComponent={<EmptyState type="Splits" onCreate={onCreateSplit} />}
      {...flatListProps}
    />
  );
};

export default React.memo(WorkoutProgramLibrary);