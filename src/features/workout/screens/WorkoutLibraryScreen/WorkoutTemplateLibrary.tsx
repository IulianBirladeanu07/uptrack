import { useState, useCallback, memo, type ReactElement } from 'react';
import { FlatList, Alert } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { formatWorkoutDate } from '../../utils/formatWorkoutDate';
import TemplateItemJS from './components/TemplateItem';
const TemplateItem = TemplateItemJS as any;
import EmptyState from './components/EmptyState';
import { getWorkoutTemplateKey } from './workoutTemplateKey';

type TemplateItemData = {
  id?: string;
  templateName?: string;
  data?: { id?: string; templateName?: string; [key: string]: unknown };
  [key: string]: unknown;
};

type WorkoutTemplateLibraryProps = {
  templates: TemplateItemData[];
  navigation: any;
  refreshControl?: ReactElement | undefined;
  hasActiveWorkout: boolean;
  onCreateTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
};

const WorkoutTemplateLibrary = ({ templates, navigation, refreshControl, hasActiveWorkout, onCreateTemplate, onDeleteTemplate }: WorkoutTemplateLibraryProps) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const formatDate = useCallback((timestamp: unknown) => formatWorkoutDate(timestamp, 'N/A'), []);

  const handleEditTemplate = useCallback((template: any) => {
    const id = template.id;
    const data = template.data || template;
    navigation.navigate('CreateTemplate', { 
      template: { ...data, id },
      isEditing: true 
    });
  }, [navigation]);

  const handleStartWorkout = useCallback((template: any) => {
    if (hasActiveWorkout) return;
    navigation.navigate('StartWorkout', { selectedWorkout: template });
  }, [hasActiveWorkout, navigation]);

  const handleDeletePress = useCallback((template: any) => {
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

  const toggleExpanded = useCallback((id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const renderItem = useCallback(({ item }: { item: TemplateItemData }) => (
    <TemplateItem
      item={item}
      expandedCards={expandedCards}
      onToggleExpanded={toggleExpanded}
      onEdit={handleEditTemplate}
      onStart={handleStartWorkout}
      onDelete={handleDeletePress}
      formatDate={formatDate}
      hasActiveWorkout={hasActiveWorkout}
    />
  ), [expandedCards, toggleExpanded, handleEditTemplate, handleStartWorkout, handleDeletePress, formatDate, hasActiveWorkout]);

  const keyExtractor = useCallback(
    (item: TemplateItemData, index: number) => getWorkoutTemplateKey(item, index),
    [],
  );

  return (
    <FlatList
      data={templates}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshControl={(refreshControl ?? undefined) as any}
      ListEmptyComponent={<EmptyState type="Templates" onCreate={onCreateTemplate} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: normalize(100), paddingHorizontal: normalize(18), paddingTop: normalize(18) }}
      removeClippedSubviews={true}
      initialNumToRender={5}
    />
  );
};

export default memo(WorkoutTemplateLibrary);