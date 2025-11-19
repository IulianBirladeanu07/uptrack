  import React, { useState, useCallback, useMemo } from 'react';
  import { FlatList } from 'react-native';
  import { normalize } from '../../../../shared/hooks/useResponsive';
  import TemplateItem from './components/TemplateItem';
  import EmptyState from './components/EmptyState';

  const WorkoutTemplateLibrary = ({ templates, navigation, refreshControl, onCreateTemplate }) => {
    const [expandedCards, setExpandedCards] = useState({});

    const formatDate = useMemo(() => {
      const cache = new Map();
      return (timestamp) => {
        if (!timestamp) return 'N/A';
        const key = timestamp.seconds || timestamp._seconds || timestamp.toString();
        if (cache.has(key)) return cache.get(key);
        try {
          let date;
          if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
          } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
          } else if (timestamp._seconds) {
            date = new Date(timestamp._seconds * 1000);
          } else {
            date = new Date(timestamp);
          }
          const formatted = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          cache.set(key, formatted);
          return formatted;
        } catch (error) {
          console.error('Error formatting date:', error);
          return 'N/A';
        }
      };
    }, []);

    const handleEditTemplate = useCallback((template) => {
      navigation.navigate('CreateWorkout', { template, isEditing: true });
    }, [navigation]);

    const handleStartWorkout = useCallback((template) => {
      navigation.navigate('StartWorkout', { selectedWorkout: template });
    }, [navigation]);

    const toggleExpanded = useCallback((id) => {
      setExpandedCards((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    }, []);

    const renderItem = useCallback(({ item }) => (
      <TemplateItem
        item={item}
        expandedCards={expandedCards}
        onToggleExpanded={toggleExpanded}
        onEdit={handleEditTemplate}
        onStart={handleStartWorkout}
        formatDate={formatDate}
      />
    ), [expandedCards, toggleExpanded, handleEditTemplate, handleStartWorkout, formatDate]);

    const keyExtractor = useCallback((item, index) => item.id || `template-${index}`, []);

    const flatListProps = useMemo(() => ({
      showsVerticalScrollIndicator: false,
      contentContainerStyle: { paddingBottom: normalize(100), paddingHorizontal: normalize(18) },
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
        data={templates}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        refreshControl={refreshControl}
        ListEmptyComponent={<EmptyState type="Templates" onCreate={onCreateTemplate} />}
        {...flatListProps}
      />
    );
  };

  export default React.memo(WorkoutTemplateLibrary);