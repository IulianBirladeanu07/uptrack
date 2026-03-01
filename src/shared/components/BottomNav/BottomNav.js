import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../theme';
import { createStyles } from '../../theme/createStyles';

const screens = [
    { name: 'Dashboard', label: 'Home',      icon: 'home',         iconType: 'Ionicons' },
    { name: 'Workout',   label: 'Workout',   icon: 'dumbbell',     iconType: 'MaterialCommunityIcons' },
    { name: 'Nutrition', label: 'Nutrition', icon: 'restaurant',   iconType: 'MaterialIcons' },
    { name: 'Progress',  label: 'Progress',  icon: 'insert-chart', iconType: 'MaterialIcons' },
];

const NavItem = ({ screen, isActive, onPress }) => {
    const iconColor = isActive ? colors.accent.primary : colors.text.secondary;
    const Icon =
        screen.iconType === 'MaterialIcons' ? MaterialIcons :
        screen.iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
        Ionicons;

    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
            <Icon name={screen.icon} size={spacing[6]} color={iconColor} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{screen.label}</Text>
        </TouchableOpacity>
    );
};

const BottomNav = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const currentRouteName = useNavigationState(
        state => state?.routes[state.index]?.name || 'Dashboard'
    );

    return (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, spacing[1]) }]}>
            {screens.map(screen => (
                <NavItem
                    key={screen.name}
                    screen={screen}
                    isActive={currentRouteName === screen.name}
                    onPress={() => navigation.navigate(screen.name)}
                />
            ))}
        </View>
    );
};

const styles = createStyles(() => ({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background.secondary,
        flexDirection: 'row',
        paddingHorizontal: spacing[2],
        paddingTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing[1],
        gap: spacing[1],
    },
    navLabel: {
        fontSize: fontSize[10],
        color: colors.text.quaternary,
        fontWeight: fontWeight.medium,
    },
    navLabelActive: {
        color: colors.accent.primary,
        fontWeight: fontWeight.semibold,
    },
}));

export default BottomNav;