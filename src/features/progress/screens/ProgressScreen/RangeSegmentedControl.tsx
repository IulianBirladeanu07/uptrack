import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

type Option = { key: string; label: string };
type Props = {
    options: Option[];
    selectedKey: string;
    onSelect: (key: string) => void;
    contextLabel: string;
    contextDetail: string;
    contextColor: string;
};

const styles = createStyles(() => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: spacing[12],
    },
    context: {
        flex: 1,
        minWidth: 0,
    },
    contextLabel: {
        fontSize: fontSize[12],
        fontWeight: fontWeight.semibold,
        color: colors.accent.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    contextDetail: {
        marginTop: 2,
        fontSize: fontSize[10],
        fontWeight: fontWeight.medium,
        color: colors.text.tertiary,
    },
    options: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    segment: {
        minHeight: spacing[12],
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

const RangeSegmentedControl = ({ options, selectedKey, onSelect, contextLabel, contextDetail, contextColor }: Props) => (
    <View style={styles.container}>
        <View style={styles.context}>
            <Text style={[styles.contextLabel, { color: contextColor }]}>{contextLabel}</Text>
            <Text style={styles.contextDetail} numberOfLines={1}>{contextDetail}</Text>
        </View>
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
