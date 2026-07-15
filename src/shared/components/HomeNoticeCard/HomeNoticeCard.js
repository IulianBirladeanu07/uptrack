import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../theme';
import { createStyles } from '../../theme/createStyles';

const ICONS = {
  calorie_adjustment: { name: 'flame-outline',  color: colors.accent.primary,   bg: colors.faded.primary },
  goal_reached:       { name: 'trophy-outline', color: colors.accent.success,   bg: colors.faded.success },
  bf_recheck:         { name: 'body-outline',   color: colors.accent.purple,    bg: colors.faded.purple },
  steps_permission:   { name: 'walk-outline',   color: colors.accent.stepsRed,  bg: colors.faded.error },
};

const HomeNoticeCard = ({ notice, onAction, actionLabel, onDismiss }) => {
  const icon = ICONS[notice.type] || ICONS.calorie_adjustment;

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={spacing[5]} color={icon.color} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.body}>{notice.body}</Text>
        {(onAction || onDismiss) && (
          <View style={styles.actionsRow}>
            {onAction && (
              <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
                <Text style={styles.actionText}>{actionLabel || 'Update'}</Text>
              </TouchableOpacity>
            )}
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
                <Text style={styles.dismissText}>Not now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {onDismiss && !onAction && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color={colors.text.quaternary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = createStyles(() => ({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: spacing[1] },
  title: { fontSize: fontSize[14], fontWeight: fontWeight.bold, color: colors.text.primary },
  body: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.secondary, lineHeight: fontSize[16] },
  actionsRow: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[2] },
  actionText: { fontSize: fontSize[13], fontWeight: fontWeight.bold, color: colors.accent.primary },
  dismissText: { fontSize: fontSize[13], fontWeight: fontWeight.semibold, color: colors.text.quaternary },
  closeBtn: { padding: spacing[1] },
}));

export default HomeNoticeCard;