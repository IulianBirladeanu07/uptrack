import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

type Option = { key: string; label: string };
type Props = {
    options: Option[];
    selectedKey: string;
    onSelect: (key: string) => void;
};

const styles = createStyles(() => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: spacing[11],
    },
    rangeLabel: {
        fontSize: fontSize[10],
        fontWeight: fontWeight.semibold,
        color: colors.text.quaternary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    options: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    segment: {
        minHeight: spacing[11],
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[1],
    },
    label: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
        textAlign: 'center',
    },
    labelSelected: {
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
}));

const RangeSegmentedControl = ({ options, selectedKey, onSelect }: Props) => (
    <View style={styles.container}>
        <Text style={styles.rangeLabel}>Range</Text>
        <View style={styles.options}>
            {options.map(option => {
                const selected = option.key === selectedKey;
                return (
                    <TouchableOpacity
                        key={option.key}
                        style={styles.segment}
                        onPress={() => onSelect(option.key)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option.label}
                        hitSlop={{ top: spacing[1], bottom: spacing[1] }}
                    >
                        <Text
                            style={[styles.label, selected && styles.labelSelected]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            maxFontSizeMultiplier={1.3}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

export default RangeSegmentedControl;
