import { useState, useRef, memo, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Animated,
  Vibration,
  Platform,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../auth/services/firebaseConfigService';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const Notification = memo(({ message, visible, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.notification,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationIconWrapper}>
          <MaterialCommunityIcons 
            name="check-circle" 
            size={16} 
            color={colors.accent.primary}
          />
        </View>
        <Text style={styles.notificationText}>{message}</Text>
      </View>
    </Animated.View>
  );
});

const EntryRow = memo(({ entry, isLast }) => (
  <View style={[styles.entryRow, !isLast && styles.entryRowBorder]}>
    <View style={styles.entryLeft}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="calendar" size={24} color={colors.accent.primary} />
      </View>
      <View style={styles.entryTextContent}>
        <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} kg</Text>
        <Text style={styles.entryDate}>{entry.displayDate}</Text>
      </View>
    </View>
    
    <View style={styles.entryRight}>
      {Math.abs(entry.change) > 0.05 ? (
        <View style={styles.changeContainer}>
          <Text style={[
            styles.entryChange,
            entry.positive ? styles.changePositive : styles.changeNegative
          ]}>
            {entry.positive ? '−' : '+'}
            {entry.change.toFixed(1)}
          </Text>
          <View style={[
            styles.arrowBadge,
            entry.positive ? styles.arrowBadgePositive : styles.arrowBadgeNegative
          ]}>
            <MaterialCommunityIcons 
              name={entry.positive ? 'arrow-down' : 'arrow-up'} 
              size={12} 
              color={entry.positive ? colors.accent.success : colors.accent.error}
            />
          </View>
        </View>
      ) : (
        <View style={styles.neutralBadge}>
          <Text style={styles.neutralText}>—</Text>
        </View>
      )}
    </View>
  </View>
));

const WeightInputView = ({
  weight,
  setWeight,
  isValid,
  saving,
  handleSave,
  selectedDate,
  setSelectedDate,
  userId,
  setActiveView,
}) => {
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [weightIns, setWeightIns] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  const isExistingEntry = useMemo(() => {
    if (!selectedDate || !recentEntries.length) return false;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return recentEntries.some(e => e.dateKey === dateStr);
  }, [selectedDate, recentEntries]);

  const lastEntry = useMemo(() => {
    if (recentEntries.length === 0) return null;
    return recentEntries[0];
  }, [recentEntries]);

  const fetchWeightInsData = async () => {
    if (!userId) return;
    setLoadingEntries(true);
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setWeightIns(snap.data().weightIns || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchWeightInsData();
  }, [userId]);

  const formatDate = (d) => {
    const val = d instanceof Date && !isNaN(d) ? d : new Date();
    if (val.toDateString() === new Date().toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (val.toDateString() === yesterday.toDateString()) return "Yesterday";
    return val.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getRecentEntries = (data, limit = 10) => {
    const entries = [];
    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    data.forEach(w => {
      if (!w.days || !w.weekStart) return;
      keys.forEach((k, i) => {
        const val = w.days[k];
        if (val !== null && val !== undefined && !isNaN(val)) {
          const start = new Date(w.weekStart);
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          entries.push({
            date: d,
            weight: parseFloat(val),
            dateKey: d.toISOString().split('T')[0],
          });
        }
      });
    });

    const map = new Map();
    entries.forEach(e => {
      if (!map.has(e.dateKey) || e.date > map.get(e.dateKey).date) {
        map.set(e.dateKey, e);
      }
    });

    const sorted = Array.from(map.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    return sorted.map((e, i) => {
      let diff = 0;
      if (i < sorted.length - 1) diff = e.weight - sorted[i + 1].weight;
      return {
        ...e,
        change: Math.abs(diff),
        positive: diff < 0,
        displayDate: formatDate(e.date),
      };
    });
  };

  useEffect(() => {
    if (weightIns?.length > 0) {
      setRecentEntries(getRecentEntries(weightIns));
    } else {
      setRecentEntries([]);
    }
  }, [weightIns]);

  const handleSavePress = async () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(saveButtonScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    
    setShowNotification(true);
    await handleSave();
    setTimeout(() => setActiveView('summary'), 800);
  };

  const handleWeightAdjust = (v) => {
    if (Platform.OS === 'ios') Vibration.vibrate(10);
    const curr = parseFloat(weight) || 0;
    setWeight(Math.max(0, Math.min(1000, curr + v)).toFixed(1));
  };

  const handleDateChange = (e, d) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (d) setSelectedDate(d);
  };

  const handleWeightTextChange = (t) => {
    const v = t.replace(/[^0-9.]/g, '');
    const p = parseFloat(v);
    if (!isNaN(p) && p >= 0 && p <= 1000) setWeight(v);
    else if (v === '') setWeight('');
  };

  return (
    <View style={styles.container}>
      <Notification 
        message={isExistingEntry ? "Weight updated successfully" : "Weight saved successfully"}
        visible={showNotification}
        onHide={() => setShowNotification(false)}
      />
      
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setActiveView('summary')} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weight Entry</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar" size={16} color={colors.text.primary} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
        )}

        {lastEntry && (
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Last Entry</Text>
            <View style={styles.heroMain}>
              <Text style={styles.heroWeight}>{lastEntry.weight.toFixed(1)} kg</Text>
              <Text style={styles.heroDate}>{lastEntry.displayDate}</Text>
              {Math.abs(lastEntry.change) > 0.05 && (
                <View style={[
                  styles.heroChangeBadge,
                  lastEntry.positive ? styles.heroChangeBadgePositive : styles.heroChangeBadgeNegative
                ]}>
                  <MaterialCommunityIcons 
                    name={lastEntry.positive ? 'arrow-down' : 'arrow-up'} 
                    size={14} 
                    color={lastEntry.positive ? colors.accent.success : colors.accent.error}
                  />
                  <Text style={[
                    styles.heroChangeText,
                    lastEntry.positive ? styles.heroChangeTextPositive : styles.heroChangeTextNegative
                  ]}>
                    {lastEntry.change.toFixed(1)} kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.weightInputSection}>
          <View style={styles.weightControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => handleWeightAdjust(-0.1)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="minus" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.weightInputWrapper}>
              <TextInput
                style={[styles.weightInput, inputFocused && styles.weightInputFocused]}
                value={weight}
                keyboardType="numeric"
                onChangeText={handleWeightTextChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                selectTextOnFocus
                maxLength={6}
                placeholder="0.0"
                placeholderTextColor={colors.text.tertiary}
              />
              <Text style={styles.weightUnit}>kg</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => handleWeightAdjust(0.1)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.entriesSection}>
          <Text style={styles.entriesTitle}>Recent Entries</Text>
          {loadingEntries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.accent.primary} size="small" />
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : recentEntries.length > 0 ? (
            <View style={styles.entriesWrapper}>
              <FlatList
                data={recentEntries}
                renderItem={({ item, index }) => (
                  <EntryRow entry={item} isLast={index === recentEntries.length - 1} />
                )}
                keyExtractor={(item, index) => `${item.dateKey}-${index}`}
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="scale" size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No weight entries yet</Text>
              <Text style={styles.emptySubtext}>Start tracking to see your history</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Animated.View style={{ transform: [{ scale: saveButtonScale }], flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isValid && styles.saveButtonDisabled,
              saving && styles.saveButtonSaving
            ]}
            onPress={handleSavePress}
            disabled={!isValid || saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color={colors.text.primary} size="small" />
            ) : (
              <MaterialCommunityIcons 
                name={isExistingEntry ? "refresh" : "check"} 
                size={20} 
                color={colors.text.primary} 
              />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? (isExistingEntry ? 'Updating...' : 'Saving...') : (isExistingEntry ? 'Update Entry' : 'Save Entry')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  notification: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[4],
    right: spacing[4],
    zIndex: 1000,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: colors.background.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  notificationIconWrapper: {
    width: spacing[7],
    height: spacing[7],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  backButton: {
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[5],
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize[20],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius[4],
    gap: spacing[1],
  },
  dateText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  heroLabel: {
    fontSize: fontSize[10],
    color: colors.text.tertiary,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroWeight: {
    fontSize: fontSize[24],
    fontWeight: fontWeight.extrabold,
    color: colors.text.primary,
  },
  heroDate: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  heroChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius[3],
    gap: spacing[1],
    marginLeft: spacing[2],
  },
  heroChangeBadgePositive: {
    backgroundColor: colors.faded.success,
  },
  heroChangeBadgeNegative: {
    backgroundColor: colors.faded.error,
  },
  heroChangeText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.bold,
  },
  heroChangeTextPositive: {
    color: colors.accent.success,
  },
  heroChangeTextNegative: {
    color: colors.accent.error,
  },
  weightInputSection: {
    paddingVertical: spacing[4],
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
  },
  controlButton: {
    width: spacing[15],
    height: spacing[15],
    borderRadius: radius[14],
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightInputWrapper: {
    alignItems: 'center',
  },
  weightInput: {
    fontSize: fontSize[48],
    fontWeight: fontWeight.black,
    textAlign: 'center',
    color: colors.accent.primary,
    minWidth: spacing[28],
    letterSpacing: -2,
  },
  weightInputFocused: {
    color: colors.accent.primaryLight,
  },
  weightUnit: {
    fontSize: fontSize[16],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    marginTop: -spacing[1],
  },
  entriesSection: {
    flex: 1,
    marginTop: spacing[2],
  },
  entriesTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  entriesWrapper: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  entryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  entryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    width: spacing[8],
    height: spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTextContent: {
    flex: 1,
  },
  entryWeight: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 20,
  },
  entryDate: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
  entryRight: {
    marginLeft: spacing[2],
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  entryChange: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    minWidth: spacing[9],
    textAlign: 'right',
  },
  changePositive: {
    color: colors.accent.success,
  },
  changeNegative: {
    color: colors.accent.error,
  },
  arrowBadge: {
    width: spacing[6],
    height: spacing[6],
    borderRadius: radius[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBadgePositive: {
    backgroundColor: colors.faded.success,
  },
  arrowBadgeNegative: {
    backgroundColor: colors.faded.error,
  },
  neutralBadge: {
    width: spacing[6],
    height: spacing[6],
    borderRadius: radius[2],
    backgroundColor: colors.faded.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  neutralText: {
    fontSize: fontSize[12],
    color: colors.text.tertiary,
    fontWeight: fontWeight.bold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  loadingText: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    marginTop: spacing[2],
    fontWeight: fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyText: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  emptySubtext: {
    fontSize: fontSize[12],
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  bottomBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent.primary,
    borderRadius: radius[4],
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    elevation: 4,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonSaving: {
    backgroundColor: colors.accent.warning,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
  },
}));

export default WeightInputView;