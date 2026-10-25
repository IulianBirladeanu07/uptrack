import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import DraggableFlatList from 'react-native-draggable-flatlist';
import ExerciseItemJS from '../../../components/ExerciseItem/ExerciseItem';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExerciseItem = ExerciseItemJS as any;
import { createStyles } from '../../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../shared/theme';

const EmptyState = () => (
    <View style={styles.emptyContainer}>
        <Feather name="clipboard" size={spacing[9]} color={colors.text.secondary} />
        <Text style={styles.emptyText}>
            No exercises added yet.{'\n'}Start building your workout!
        </Text>
    </View>
);

type ExerciseRow = {
    id: string;
    exerciseName?: string;
    name?: string;
    numSets?: number | string;
    repRange?: string;
    note?: string;
    restTime?: number;
    [key: string]: unknown;
};

type ExercisesStepProps = {
    exercises: ExerciseRow[];
    handleAddExercise: () => void;
    handleSetsChange: (...args: never[]) => void;
    handleRepsChange: (...args: never[]) => void;
    handleDeleteExercise: (...args: never[]) => void;
    handleNoteChange: (...args: never[]) => void;
    handleReplaceExercise: (...args: never[]) => void;
    handleRestBetweenSetsChange: (...args: never[]) => void;
    handleReorderExercises: (exercises: ExerciseRow[]) => void;
    scrollViewRef?: unknown;
};

export const ExercisesStep = ({
    exercises,
    handleAddExercise,
    handleSetsChange,
    handleRepsChange,
    handleDeleteExercise,
    handleNoteChange,
    handleReplaceExercise,
    handleRestBetweenSetsChange,
    handleReorderExercises,
    scrollViewRef,
}: ExercisesStepProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const hasAutoExpandedRef = useRef(false);

    useEffect(() => {
        if (!hasAutoExpandedRef.current && exercises.length > 0) {
            setExpandedId(exercises[0].id);
            hasAutoExpandedRef.current = true;
        }
    }, [exercises]);

    const handleToggleExpand = useCallback((id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    }, []);

    const renderItem = useCallback(({ item, drag, isActive }: { item: ExerciseRow; drag: () => void; isActive: boolean }) => {
        return (
            <ExerciseItem
                exercise={item}
                isExpanded={expandedId === item.id}
                onToggle={handleToggleExpand}
                onSetsChange={handleSetsChange}
                onRepsChange={handleRepsChange}
                onNoteChange={handleNoteChange}
                onReplace={handleReplaceExercise}
                onDelete={handleDeleteExercise}
                onRestBetweenSetsChange={handleRestBetweenSetsChange}
                onDrag={exercises.length > 1 ? drag : undefined}
                isDragging={isActive}
            />
        );
    }, [
        expandedId,
        handleToggleExpand,
        handleSetsChange,
        handleRepsChange,
        handleNoteChange,
        handleReplaceExercise,
        handleDeleteExercise,
        handleRestBetweenSetsChange,
        exercises.length,
    ]);

    return (
        <View style={styles.container}>
            <View style={styles.exerciseHeaderRow}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <View style={styles.exerciseCount}>
                    <Text style={styles.exerciseCountText}>{exercises.length} total</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <DraggableFlatList
                ref={scrollViewRef as never}
                data={exercises}
                keyExtractor={(item: ExerciseRow) => item.id}
                renderItem={renderItem}
                onDragEnd={({ data }: { data: ExerciseRow[] }) => handleReorderExercises(data)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={EmptyState}
                ListFooterComponent={
                    <TouchableOpacity
                        style={styles.addExerciseButton}
                        onPress={handleAddExercise}
                        activeOpacity={0.7}
                    >
                        <Feather name="plus" size={spacing.iconMd} color={colors.accent.buttonText} />
                        <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
                    </TouchableOpacity>
                }
            />
        </View>
    );
};

const styles = createStyles(() => ({
    container: {
        flex: 1,
    },
    exerciseHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
        paddingHorizontal: spacing[3],
    },
    sectionTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        letterSpacing: 0.2,
    },
    exerciseCount: {
        paddingVertical: spacing[1],
        paddingHorizontal: spacing[2],
        borderRadius: radius[2],
    },
    exerciseCountText: {
        fontSize: fontSize[12],
        color: colors.accent.primary,
        fontWeight: fontWeight.bold,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border.light,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[15],
    },
    emptyText: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[3],
        lineHeight: fontSize[20],
    },
    addExerciseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent.primary,
        borderRadius: radius[3],
        paddingVertical: spacing[4],
        marginTop: spacing[5],
        marginHorizontal: spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    addExerciseButtonText: {
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
        color: colors.accent.buttonText,
        marginLeft: spacing[2],
    },
    listContent: {
        paddingBottom: spacing[24],
    },
}));

export default ExercisesStep;