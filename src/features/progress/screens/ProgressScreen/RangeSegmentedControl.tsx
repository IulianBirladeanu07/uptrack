import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../../shared/theme';
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
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: radius[5],
        padding: spacing[1],
    },
    segment: {
        flex: 1,
        minHeight: spacing[12],
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[2],
        borderRadius: radius[4],
    },
    segmentSelected: {
        backgroundColor: colors.background.tertiary,
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
        {options.map(option => {
            const selected = option.key === selectedKey;
            return (
                <TouchableOpacity
                    key={option.key}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => onSelect(option.key)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
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
);

export default RangeSegmentedControl;
