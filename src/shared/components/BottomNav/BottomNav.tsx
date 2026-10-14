import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationState } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../theme';
import { createStyles } from '../../theme/createStyles';
import { useAppNavigation } from '../../navigation/hooks';

const BOTTOM_NAV_SPACE = 70;

export const useBottomNavInset = () => {
    const insets = useSafeAreaInsets();
    return BOTTOM_NAV_SPACE + insets.bottom;
};

type NavScreen = {
    name: 'Dashboard' | 'Workout' | 'Nutrition' | 'Progress';
    label: string;
    renderIcon: (color: string) => ReactNode;
};

const screens: NavScreen[] = [
    { name: 'Dashboard', label: 'Home',      renderIcon: color => <Ionicons name="home" size={spacing[6]} color={color} /> },
    { name: 'Workout',   label: 'Workout',   renderIcon: color => <MaterialCommunityIcons name="dumbbell" size={spacing[6]} color={color} /> },
    { name: 'Nutrition', label: 'Nutrition', renderIcon: color => <MaterialIcons name="restaurant" size={spacing[6]} color={color} /> },
    { name: 'Progress',  label: 'Progress',  renderIcon: color => <MaterialIcons name="insert-chart" size={spacing[6]} color={color} /> },
];

type NavItemProps = {
    screen: NavScreen;
    isActive: boolean;
    onPress: () => void;
};

const NavItem = ({ screen, isActive, onPress }: NavItemProps) => {
    const iconColor = isActive ? colors.accent.primary : colors.text.secondary;

    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>
            {screen.renderIcon(iconColor)}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{screen.label}</Text>
        </TouchableOpacity>
    );
};

const BottomNav = () => {
    const insets = useSafeAreaInsets();
    const navigation = useAppNavigation();
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
