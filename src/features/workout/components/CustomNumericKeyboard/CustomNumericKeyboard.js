import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const CustomNumericKeyboard = ({ value, onChangeText, onDone, onNext, focusedInputData }) => {
    const shouldReplaceRef = useRef(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        shouldReplaceRef.current = true;
    }, [focusedInputData]);

    const handlePress = useCallback((key) => {
        if (key === '⌫') {
            onChangeText(value.slice(0, -1));
            shouldReplaceRef.current = false;
            return;
        }

        if (shouldReplaceRef.current) {
            if (key === '.') return;
            onChangeText(key);
            shouldReplaceRef.current = false;
            return;
        }

        if (key === '.') {
            if (value.includes('.')) return;
            if (value.length === 0) return;
            onChangeText(value + key);
            return;
        }

        if (value.includes('.')) {
            const decimals = value.split('.')[1];
            if (decimals.length >= 1) return;
        }

        if (value.replace('.', '').length >= 5) return;

        onChangeText(value + key);
    }, [value, onChangeText]);

    const handleNextPress = useCallback(() => {
        shouldReplaceRef.current = true;
        onNext();
    }, [onNext]);

    const handleDonePress = useCallback(() => {
        shouldReplaceRef.current = true;
        onDone();
    }, [onDone]);

    return (
        <View style={[styles.container, { paddingBottom: spacing[5] + insets.bottom }]}>
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNextPress} activeOpacity={0.7}>
                    <Text style={styles.nextText}>→ Next</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={handleDonePress} activeOpacity={0.7}>
                    <Text style={styles.doneText}>✓ Done</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.row}>
                {['1', '2', '3'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
            </View>
            <View style={styles.row}>
                {['4', '5', '6'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
            </View>
            <View style={styles.row}>
                {['7', '8', '9'].map(k => <Key key={k} k={k} onPress={handlePress} />)}
            </View>
            <View style={styles.row}>
                <Key k="." onPress={handlePress} specialStyle={styles.keySpecial} specialTextStyle={styles.dotText} />
                <Key k="0" onPress={handlePress} />
                <Key k="⌫" onPress={handlePress} specialStyle={styles.keySpecial} specialTextStyle={styles.deleteText} />
            </View>
        </View>
    );
};

const Key = React.memo(({ k, onPress, specialStyle, specialTextStyle }) => (
    <TouchableOpacity
        style={[styles.key, specialStyle]}
        onPress={() => onPress(k)}
        activeOpacity={0.7}
    >
        <Text style={[styles.keyText, specialTextStyle]}>
            {k}
        </Text>
    </TouchableOpacity>
));

const styles = createStyles(() => ({
    container: {
        backgroundColor: colors.background.primary,
        paddingHorizontal: spacing[3],
        paddingTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 12,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: spacing[3],
    },
    nextBtn: {
        backgroundColor: colors.faded.primary,
        height: spacing[9],
        paddingHorizontal: spacing[4],
        borderRadius: radius[3],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing[2],
        borderWidth: 1,
        borderColor: colors.border.primary,
    },
    nextText: {
        color: colors.accent.primary,
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
    },
    doneBtn: {
        backgroundColor: colors.faded.cyanDark,
        height: spacing[9],
        paddingHorizontal: spacing[4],
        borderRadius: radius[3],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.cyanDark,
    },
    doneText: {
        color: colors.accent.cyan,
        fontSize: fontSize[14],
        fontWeight: fontWeight.semibold,
    },
    row: {
        flexDirection: 'row',
        marginBottom: spacing[2],
        gap: spacing[2],
    },
    key: {
        flex: 1,
        height: spacing[14],
        backgroundColor: colors.background.secondary,
        borderRadius: radius[3],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    keySpecial: {
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.default,
    },
    keyText: {
        color: colors.text.primary,
        fontSize: fontSize[24],
        fontWeight: fontWeight.medium,
    },
    dotText: {
        fontSize: fontSize[28],
        color: colors.text.quaternary,
        fontWeight: fontWeight.bold,
    },
    deleteText: {
        fontSize: fontSize[18],
        color: colors.text.quaternary,
    },
}));

export default React.memo(CustomNumericKeyboard);