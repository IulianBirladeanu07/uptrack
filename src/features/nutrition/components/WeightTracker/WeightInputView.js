import { useState, useRef, useEffect, memo, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  StyleSheet, 
  Animated,
  Vibration,
  Platform,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../auth/services/firebaseConfigService';

const colors = {
  primaryBg: '#0A0E13',
  cardBg: '#151B23',
  surfaceBg: '#1F2937',
  primaryOrange: '#FF9500',
  secondaryOrange: '#FFB347',
  success: '#32D74B',
  danger: '#FF453A',
  buttonNeutral: '#3A4A5C',
  primaryText: '#FFFFFF',
  secondaryText: '#9CA3AF',
  tertiaryText: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
};

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
            size={normalize(16)} 
            color={colors.primaryOrange}
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
      <View style={styles.entryIconContainer}>
        <MaterialCommunityIcons name="scale-bathroom" size={normalize(18)} color={colors.primaryOrange} />
      </View>
      <View style={styles.entryInfo}>
        <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} kg</Text>
        <Text style={styles.entryDate}>{entry.displayDate}</Text>
      </View>
    </View>
    
    <View style={styles.entryRight}>
      {Math.abs(entry.change) > 0.05 ? (
        <>
          <Text style={[
            styles.entryChange,
            entry.positive ? styles.changePositive : styles.changeNegative
          ]}>
            {entry.positive ? '−' : '+'}
            {entry.change.toFixed(1)}
          </Text>
          <View style={[
            styles.trendBadge,
            entry.positive ? styles.trendBadgePositive : styles.trendBadgeNegative
          ]}>
            <MaterialCommunityIcons 
              name={entry.positive ? 'arrow-down' : 'arrow-up'} 
              size={normalize(12)} 
              color={entry.positive ? colors.success : colors.danger}
            />
          </View>
        </>
      ) : (
        <View style={styles.trendBadgeNeutral}>
          <Text style={styles.trendNeutralText}>—</Text>
        </View>
      )}
    </View>
  </View>
));

const WeightInInputView = ({
  weight,
  setWeight,
  isValid,
  saving,
  handleSave,
  currentWeight,
  selectedDate,
  setSelectedDate,
  userId,
  setActiveView,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [weightIns, setWeightIns] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  const isExistingEntry = useMemo(() => {
    if (!selectedDate || !recentEntries.length) return false;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return recentEntries.some(e => e.dateKey === dateStr);
  }, [selectedDate, recentEntries]);

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

  const currentWeightValue = parseFloat(weight) || currentWeight || 82.5;
  const goalWeight = 78.0;
  const startWeight = 87.0;
  const totalLoss = startWeight - goalWeight;
  const currentLoss = startWeight - currentWeightValue;
  const progressPercentage = Math.min((currentLoss / totalLoss) * 100, 100);
  const remainingWeight = Math.max(currentWeightValue - goalWeight, 0);
  const weeklyRate = 0.5;

  const formatDate = (d) => {
    const val = d instanceof Date && !isNaN(d) ? d : new Date();
    if (val.toDateString() === new Date().toDateString()) return "Today";
    return val.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

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
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setActiveView('summary')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={normalize(24)} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weight Entry</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <MaterialCommunityIcons name="calendar" size={normalize(16)} color={colors.primaryText} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progress to Goal</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercentage.toFixed(0)}%</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <View style={styles.progressMarkers}>
            <Text style={styles.markerText}>87kg</Text>
            <Text style={styles.markerText}>78kg</Text>
          </View>
          <View style={styles.progressSummary}>
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Lost</Text>
              <Text style={styles.progressValue}>{currentLoss.toFixed(1)} kg</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Remaining</Text>
              <Text style={styles.progressValue}>{remainingWeight.toFixed(1)} kg</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressItem}>
              <Text style={styles.progressLabel}>Rate</Text>
              <Text style={styles.progressValue}>-{weeklyRate}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.weightSection}>
          <Text style={styles.sectionTitle}>Current Weight</Text>
          <View style={styles.weightDisplay}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleWeightAdjust(-0.1)}>
              <MaterialCommunityIcons name="minus" size={normalize(24)} color={colors.primaryText} />
            </TouchableOpacity>
            <View style={styles.weightContainer}>
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
                placeholderTextColor={colors.tertiaryText}
              />
              <Text style={styles.unitText}>kg</Text>
            </View>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => handleWeightAdjust(0.1)}>
              <MaterialCommunityIcons name="plus" size={normalize(24)} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickAdjustContainer}>
            {['-1.0', '-0.5', '+0.5', '+1.0'].map((v) => (
              <TouchableOpacity key={v} style={styles.quickAdjustPill} onPress={() => handleWeightAdjust(parseFloat(v))}>
                <Text style={styles.quickAdjustText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {loadingEntries ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.primaryOrange} size="small" />
              <Text style={styles.loadingText}>Loading entries...</Text>
            </View>
          ) : recentEntries.length > 0 ? (
            <View style={styles.entriesContainerWrapper}>
              <FlatList
                data={recentEntries}
                renderItem={({ item, index }) => <EntryRow entry={item} isLast={index === recentEntries.length - 1} />}
                keyExtractor={(item, index) => `${item.dateKey}-${index}`}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={4}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="scale" size={normalize(48)} color={colors.tertiaryText} />
              <Text style={styles.emptyStateText}>No weight entries yet</Text>
            </View>
          )}
        </View>

        <View style={styles.saveButtonContainer}>
          <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !isValid && styles.saveButtonDisabled,
                saving && styles.saveButtonSaving,
                isExistingEntry && !saving && { backgroundColor: colors.primaryOrange }
              ]}
              onPress={handleSavePress}
              disabled={!isValid || saving}
            >
              <View style={styles.saveButtonContent}>
                {saving ? (
                  <ActivityIndicator color={colors.primaryText} size="small" />
                ) : (
                  <MaterialCommunityIcons name={isExistingEntry ? "refresh" : "check"} size={normalize(20)} color={colors.primaryText} />
                )}
                <Text style={styles.saveButtonText}>
                  {saving ? (isExistingEntry ? 'Updating...' : 'Saving...') : (isExistingEntry ? 'Update Entry' : 'Save Entry')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBg,
  },
  notification: {
    position: 'absolute',
    top: normalize(70),
    left: normalize(16),
    right: normalize(16),
    zIndex: 1000,
    backgroundColor: colors.cardBg,
    borderRadius: normalize(14),
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(16),
    gap: normalize(10),
  },
  notificationIconWrapper: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    backgroundColor: `${colors.primaryOrange}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    color: colors.primaryText,
    fontSize: normalize(14),
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: normalize(20),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: colors.primaryText,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(18),
    gap: normalize(6),
  },
  dateText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: colors.primaryText,
  },
  progressSection: {
    backgroundColor: colors.cardBg,
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: colors.border,
    padding: normalize(20),
    marginBottom: normalize(20),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(16),
  },
  progressTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primaryText,
  },
  progressBadge: {
    backgroundColor: `${colors.primaryOrange}20`,
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(10),
  },
  progressBadgeText: {
    fontSize: normalize(11),
    fontWeight: '700',
    color: colors.primaryOrange,
  },
  progressBarContainer: {
    height: normalize(8),
    backgroundColor: colors.surfaceBg,
    borderRadius: normalize(4),
    overflow: 'hidden',
    marginBottom: normalize(12),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryOrange,
    borderRadius: normalize(4),
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(16),
  },
  markerText: {
    fontSize: normalize(11),
    color: colors.tertiaryText,
    fontWeight: '500',
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: normalize(11),
    color: colors.secondaryText,
    fontWeight: '500',
    marginBottom: normalize(4),
  },
  progressValue: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primaryText,
  },
  progressDivider: {
    width: 1,
    height: normalize(32),
    backgroundColor: colors.surfaceBg,
  },
  weightSection: {
    alignItems: 'center',
    marginBottom: normalize(20),
  },
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(16),
    alignSelf: 'flex-start',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(24),
    alignSelf: 'stretch',
  },
  adjustBtn: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weightContainer: {
    alignItems: 'center',
    marginHorizontal: normalize(32),
  },
  weightInput: {
    fontSize: normalize(72),
    fontWeight: '800',
    textAlign: 'center',
    color: colors.primaryOrange,
    paddingVertical: normalize(12),
    minWidth: normalize(180),
    letterSpacing: -2,
  },
  weightInputFocused: {
    color: colors.secondaryOrange,
  },
  unitText: {
    fontSize: normalize(18),
    color: colors.secondaryText,
    fontWeight: '600',
    marginTop: normalize(-8),
  },
  quickAdjustContainer: {
    flexDirection: 'row',
    gap: normalize(10),
    alignSelf: 'stretch',
  },
  quickAdjustPill: {
    flex: 1,
    paddingVertical: normalize(10),
    borderRadius: normalize(14),
    backgroundColor: colors.cardBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  quickAdjustText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.primaryText,
  },
  historySection: {
    flex: 1,
    marginBottom: normalize(16),
  },
  entriesContainerWrapper: {
    backgroundColor: colors.cardBg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    height: normalize(235),
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(12),
  },
  entryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: normalize(10),
  },
  entryIconContainer: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(9),
    backgroundColor: `${colors.primaryOrange}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryWeight: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(1),
  },
  entryDate: {
    fontSize: normalize(11),
    color: colors.secondaryText,
    fontWeight: '500',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  entryChange: {
    fontSize: normalize(14),
    fontWeight: '700',
    minWidth: normalize(45),
    textAlign: 'right',
  },
  changePositive: {
    color: colors.success,
  },
  changeNegative: {
    color: colors.danger,
  },
  trendBadge: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadgePositive: {
    backgroundColor: `${colors.success}20`,
  },
  trendBadgeNegative: {
    backgroundColor: `${colors.danger}20`,
  },
  trendBadgeNeutral: {
    width: normalize(26),
    height: normalize(26),
    borderRadius: normalize(7),
    backgroundColor: `${colors.tertiaryText}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendNeutralText: {
    fontSize: normalize(13),
    color: colors.tertiaryText,
    fontWeight: '700',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(32),
  },
  loadingText: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    marginTop: normalize(8),
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(40),
  },
  emptyStateText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.secondaryText,
    marginTop: normalize(12),
  },
  saveButtonContainer: {
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(4),
  },
  saveButton: {
    backgroundColor: colors.primaryOrange,
    borderRadius: normalize(16),
    paddingVertical: normalize(18),
    paddingHorizontal: normalize(32),
    elevation: 4,
    shadowColor: colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.buttonNeutral,
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonSaving: {
    backgroundColor: colors.warning,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
  },
  saveButtonText: {
    color: colors.primaryText,
    fontSize: normalize(16),
    fontWeight: '700',
  },
});

export default WeightInInputView;