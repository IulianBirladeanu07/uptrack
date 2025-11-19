import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView
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
  warning: '#FF9F0A',
  danger: '#FF453A',
  buttonNeutral: '#3A4A5C',
  quickAdjustBorder: '#2A3A4A',
  quickAdjustBg: '#1E2E3E',
  primaryText: '#FFFFFF',
  secondaryText: '#9CA3AF',
  tertiaryText: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
};

export const InputView = ({
  weight,
  setWeight,
  adjustWeight,
  isValid,
  saving,
  handleSave,
  currentWeight,
  weeklyAverage,
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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;

  const fetchWeightInsData = async () => {
    if (!userId) return;
    
    setLoadingEntries(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const weightInsData = data.weightIns || [];
        setWeightIns(weightInsData);
      }
    } catch (error) {
      console.error('Error fetching weightIns:', error);
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
  const weeksToGoal = Math.ceil(remainingWeight / weeklyRate);
  const journeyPercentage = ((startWeight - currentWeightValue) / (startWeight - goalWeight)) * 100;

  const getRecentEntries = (weightIns, limit = 5) => {
    const entries = [];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    weightIns.forEach(week => {
      if (!week.days || !week.weekStart) return;

      dayKeys.forEach((dayKey, dayIndex) => {
        const weight = week.days[dayKey];
        if (weight !== null && weight !== undefined && !isNaN(weight)) {
          const weekStartDate = new Date(week.weekStart);
          const entryDate = new Date(weekStartDate);
          entryDate.setDate(weekStartDate.getDate() + dayIndex);

          entries.push({
            date: entryDate,
            weight: parseFloat(weight),
            dateKey: entryDate.toISOString().split('T')[0],
          });
        }
      });
    });

    const uniqueEntries = new Map();
    entries.forEach(entry => {
      if (!uniqueEntries.has(entry.dateKey) || entry.date > uniqueEntries.get(entry.dateKey).date) {
        uniqueEntries.set(entry.dateKey, entry);
      }
    });

    const sortedEntries = Array.from(uniqueEntries.values())
      .sort((a, b) => b.date - a.date)
      .slice(0, limit);

    return sortedEntries.map((entry, index) => {
      let change = 0;
      if (index < sortedEntries.length - 1) {
        change = entry.weight - sortedEntries[index + 1].weight;
      }

      return {
        ...entry,
        change: Math.abs(change),
        positive: change < 0,
        displayDate: formatDate(entry.date),
      };
    });
  };

  useEffect(() => {
    if (weightIns && weightIns.length > 0) {
      const processedEntries = getRecentEntries(weightIns);
      setRecentEntries(processedEntries);
    } else {
      setRecentEntries([]);
    }
  }, [weightIns]);

  const handleSavePress = async () => {
    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    await handleSave();
    await fetchWeightInsData();
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleWeightAdjust = (increment) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    
    const currentValue = parseFloat(weight) || 0;
    const newValue = Math.max(0, Math.min(1000, currentValue + increment));
    setWeight(newValue.toFixed(1));
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date) => {
    const validDate = date instanceof Date && !isNaN(date) ? date : new Date();
    const today = new Date();
    
    if (validDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    return validDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleWeightTextChange = (text) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parsedValue = parseFloat(numericValue);
    
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 1000) {
      setWeight(numericValue);
    } else if (numericValue === '') {
      setWeight('');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setActiveView('summary')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={normalize(24)} color={colors.primaryText} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Weight Entry</Text>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="calendar" size={normalize(16)} color={colors.primaryText} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

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
              <TouchableOpacity 
                style={styles.adjustBtn} 
                onPress={() => handleWeightAdjust(-0.1)}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="minus" size={normalize(24)} color={colors.primaryText} />
              </TouchableOpacity>
              
              <View style={styles.weightContainer}>
                <TextInput
                  style={[
                    styles.weightInput,
                    inputFocused && styles.weightInputFocused
                  ]}
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
              
              <TouchableOpacity 
                style={styles.adjustBtn} 
                onPress={() => handleWeightAdjust(0.1)}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="plus" size={normalize(24)} color={colors.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickAdjustContainer}>
              {['-1.0', '-0.5', '+0.5', '+1.0'].map((value) => (
                <TouchableOpacity 
                  key={value}
                  style={styles.quickAdjustPill} 
                  onPress={() => handleWeightAdjust(parseFloat(value))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAdjustText}>{value}</Text>
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
                {recentEntries.map((entry, index) => (
                  <View 
                    key={`${entry.dateKey}-${index}`} 
                    style={[
                      styles.entryRow,
                      index !== recentEntries.length - 1 && styles.entryRowWithBorder
                    ]}
                  >
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} kg</Text>
                      <Text style={styles.entryDate}>{entry.displayDate}</Text>
                    </View>
                    <View style={styles.entryTrendContainer}>
                      {Math.abs(entry.change) > 0 && (
                        <Text style={[
                          styles.entryChange,
                          entry.positive ? styles.changePositive : styles.changeNegative
                        ]}>
                          {entry.positive ? '−' : '+'}
                          {entry.change.toFixed(1)}
                        </Text>
                      )}
                      <View style={[
                        styles.trendIcon,
                        entry.positive && styles.trendIconPositive,
                        !entry.positive && styles.trendIconNegative,
                        Math.abs(entry.change) < 0.1 && styles.trendIconNeutral
                      ]}>
                        <MaterialCommunityIcons 
                          name={
                            Math.abs(entry.change) < 0.1 ? 'minus' : 
                            entry.positive ? 'trending-down' : 'trending-up'
                          } 
                          size={normalize(14)} 
                          color={
                            Math.abs(entry.change) < 0.1 ? colors.tertiaryText :
                            entry.positive ? colors.success : colors.danger
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="scale" size={normalize(48)} color={colors.tertiaryText} />
                <Text style={styles.emptyStateText}>No weight entries yet</Text>
              </View>
            )}
          </View>

        </ScrollView>

        <View style={styles.saveButtonContainer}>
          <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !isValid && styles.saveButtonDisabled,
                saving && styles.saveButtonSaving
              ]}
              onPress={handleSavePress}
              disabled={!isValid || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <View style={styles.saveButtonContent}>
                  <ActivityIndicator color={colors.primaryText} size="small" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <MaterialCommunityIcons 
                    name="check" 
                    size={normalize(20)} 
                    color={colors.primaryText} 
                  />
                  <Text style={styles.saveButtonText}>Save Entry</Text>
                </View>
              )}
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
  content: {
    flex: 1,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(24),
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

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: normalize(100),
  },

  progressSection: {
    backgroundColor: colors.cardBg,
    borderRadius: normalize(20),
    borderWidth: 1,
    borderColor: colors.border,
    padding: normalize(20),
    marginBottom: normalize(32),
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
    marginBottom: normalize(32),
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
    marginBottom: normalize(16),
  },
  entriesContainerWrapper: {
    backgroundColor: colors.cardBg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  entriesContainer: {
    paddingHorizontal: normalize(0),
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(14),
    backgroundColor: 'transparent',
  },
  entryRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(6),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: normalize(28),
  },
  trendIconPositive: {
    backgroundColor: 'transparent',
  },
  trendIconNegative: {
    backgroundColor: 'transparent',
  },
  trendIconNeutral: {
    backgroundColor: 'transparent',
  },
  entryInfo: {
    flex: 1,
  },
  entryWeight: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: colors.primaryText,
  },
  entryDate: {
    fontSize: normalize(11),
    color: colors.secondaryText,
    fontWeight: '400',
    marginTop: normalize(1),
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