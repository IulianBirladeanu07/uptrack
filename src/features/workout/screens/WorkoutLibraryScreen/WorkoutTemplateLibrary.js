import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, Alert } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import TemplateItem from './components/TemplateItem';
import EmptyState from './components/EmptyState';

const WorkoutTemplateLibrary = ({ templates, navigation, refreshControl, onCreateTemplate, onDeleteTemplate }) => {
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
        return 'N/A';
      }
    };
  }, []);

  const handleEditTemplate = useCallback((template) => {
    const id = template.id;
    const data = template.data || template;
    navigation.navigate('CreateWorkout', { 
      template: { ...data, id },
      isEditing: true 
    });
  }, [navigation]);

  const handleStartWorkout = useCallback((template) => {
    navigation.navigate('StartWorkout', { selectedWorkout: template });
  }, [navigation]);

  const handleDeletePress = useCallback((template) => {
    const id = template.id;
    const name = template.data?.templateName || template.templateName || 'Workout';

    if (!id) {
      Alert.alert('Error', 'Template ID not found');
      return;
    }

    Alert.alert(
      'Delete Template',
      `Delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => onDeleteTemplate(id) 
        }
      ]
    );
  }, [onDeleteTemplate]);

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
      onDelete={handleDeletePress}
      formatDate={formatDate}
    />
  ), [expandedCards, toggleExpanded, handleEditTemplate, handleStartWorkout, handleDeletePress, formatDate]);

  const keyExtractor = useCallback((item) => item.id || Math.random().toString(), []);

  return (
    <FlatList
      data={templates}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={refreshControl}
      ListEmptyComponent={<EmptyState type="Templates" onCreate={onCreateTemplate} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: normalize(100), paddingHorizontal: normalize(18), paddingTop: normalize(18) }}
      removeClippedSubviews={true}
      initialNumToRender={5}
    />
  );
};

export default React.memo(WorkoutTemplateLibrary);