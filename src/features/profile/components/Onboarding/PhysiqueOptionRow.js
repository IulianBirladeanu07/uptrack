import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const PHYSIQUE_IMAGES = {
  male: {
    shredded: null,
    very_lean: null,
    lean: null,
    higher_bf: null,
  },
  female: {
    shredded: null,
    very_lean: null,
    lean: null,
    higher_bf: null,
  },
};

const CATEGORY_GAUGE_LEVEL = { shredded: 1, very_lean: 2, lean: 3, higher_bf: 4 };

const PhysiqueOptionRow = ({ category, gender, selected, onPress }) => {
  const imageSource = PHYSIQUE_IMAGES[gender]?.[category.value] || null;
  const gaugeLevel = CATEGORY_GAUGE_LEVEL[category.value] || 0;

  return (
    <TouchableOpacity
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onPress(category.value)}
      activeOpacity={0.7}
    >
      <View style={styles.visual}>
        {imageSource
          ? <Image source={imageSource} style={styles.image} resizeMode="cover" />
          : (
            <View style={styles.fallback}>
              <View style={styles.gaugeRow}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={[styles.gaugeDot, i <= gaugeLevel && styles.gaugeDotFilled]} />
                ))}
              </View>
            </View>
          )}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent.primary} />}
    </TouchableOpacity>
  );
};

const styles = createStyles(() => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.tertiary,
    marginBottom: spacing[2],
  },
  rowSelected: { borderColor: colors.accent.primary, backgroundColor: colors.faded.primaryExtraLight },
  visual: { width: spacing[14], height: spacing[14], borderRadius: radius[3], overflow: 'hidden', backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: spacing[1] },
  gaugeRow: { flexDirection: 'row', gap: 3 },
  gaugeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border.default },
  gaugeDotFilled: { backgroundColor: colors.accent.primary },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: fontSize[16], fontWeight: fontWeight.bold, color: colors.text.primary },
  labelSelected: { color: colors.accent.primary },
  desc: { fontSize: fontSize[12], fontWeight: fontWeight.medium, color: colors.text.tertiary },
}));

export default PhysiqueOptionRow;