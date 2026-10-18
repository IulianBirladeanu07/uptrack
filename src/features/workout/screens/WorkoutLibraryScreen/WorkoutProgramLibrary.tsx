import { useState, useCallback, useMemo, memo, type ReactElement } from 'react';
import { FlatList, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { deleteSplitFromFirestore } from '../../services/workoutSplitService';
import ProgramItemJS from './components/ProgramItem';
const ProgramItem = ProgramItemJS as any;
import EmptyState from './components/EmptyState';

type SplitItem = {
  id?: string;
  name?: string;
  templateName?: string;
  [key: string]: unknown;
};

type WorkoutProgramLibraryProps = {
  splits: SplitItem[];
  activeSplitId?: string | null;
  navigation: any;
  refreshControl?: ReactElement | undefined;
  onCreateSplit: () => void;
  onActivateSplit: (split: SplitItem) => void;
  onSplitDeleted: (id: string, ownerUid: string) => void;
};

const WorkoutProgramLibrary = ({ 
  splits, 
  activeSplitId, 
  navigation, 
  refreshControl, 
  onCreateSplit, 
  onActivateSplit,
  onSplitDeleted,
}: WorkoutProgramLibraryProps) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const handleEditSplit = useCallback((split: SplitItem) => {
    navigation.navigate('CreateSplit', { 
      split: split,
    }); 
  }, [navigation]);

  const handlePreviewSplit = useCallback((split: SplitItem) => {
    navigation.navigate('PreviewSplit', { splitData: split });
  }, [navigation]);

  const handleDeleteSplit = useCallback(async (split: SplitItem) => {
    const ownerUid = getAuth().currentUser?.uid;
    if (!ownerUid) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

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
              if (getAuth().currentUser?.uid !== ownerUid) {
                Alert.alert('Account changed', 'Please reopen the split library before deleting a split.');
                return;
              }
              await deleteSplitFromFirestore(String(split.id));
              onSplitDeleted(String(split.id), ownerUid);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete split.');
            }
          }
        }
      ]
    );
  }, [onSplitDeleted]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const displaySplits = useMemo(() => {
    if (!activeSplitId) return splits;
    return [...splits.filter(split => split.id === activeSplitId), ...splits.filter(split => split.id !== activeSplitId)];
  }, [splits, activeSplitId]);

  const renderItem = useCallback(({ item }: { item: SplitItem }) => (
    <ProgramItem
      item={item}
      expandedCards={expandedCards}
      onToggleExpanded={toggleExpanded}
      onEdit={handleEditSplit}
      onActivate={onActivateSplit}
      onPreviewSplit={handlePreviewSplit}
      onDelete={handleDeleteSplit}
      isActive={item.id === activeSplitId}
    />
  ), [expandedCards, toggleExpanded, handleEditSplit, onActivateSplit, handlePreviewSplit, handleDeleteSplit, activeSplitId]);

  const keyExtractor = useCallback((item: any, index: number) => item.id || `split-${index}`, []);

  const flatListProps = useMemo(() => ({
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { paddingBottom: normalize(100), paddingHorizontal: normalize(18), paddingTop: normalize(18) },
    removeClippedSubviews: true,
    initialNumToRender: 5,
    maxToRenderPerBatch: 5,
    windowSize: 10,
    updateCellsBatchingPeriod: 100,
    getItemLayout: (_data: any, index: number) => ({
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
      refreshControl={(refreshControl ?? undefined) as any}
      ListEmptyComponent={<EmptyState type="Splits" onCreate={onCreateSplit} />}
      {...flatListProps}
    />
  );
};

export default memo(WorkoutProgramLibrary);