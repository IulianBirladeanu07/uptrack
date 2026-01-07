import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Text as SvgText } from 'react-native-svg';
import { normalize } from '../../../../shared/hooks/useResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const colors = {
  primaryOrange: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B', 
  danger: '#FF453A', 
  surfaceBg: '#243042',
  primaryText: '#FFFFFF',
  secondaryText: '#8E8E93',
  border: '#2A3A4A',
};

const WeightChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const [chartPeriod, setChartPeriod] = useState('7');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [chartPeriod]);

  const chartData = useMemo(() => {
    let dataSet;
    if (chartPeriod === '7') {
      const daysToShow = 7;
      const chartDataSlice = data.slice(-daysToShow);
      const paddedData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - i);
        const existingEntry = chartDataSlice.find(item => new Date(item.date).toDateString() === targetDate.toDateString());
        paddedData.push({ date: targetDate.toISOString(), weight: existingEntry?.weight ?? null });
      }
      dataSet = {
        labels: paddedData.map(item => new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1)),
        datasets: [{ data: paddedData.map(item => item.weight ?? 0), strokeWidth: 2, color: () => colors.primaryOrange }],
        rawData: paddedData,
      };
    } else {
      const last30Days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const currentDay = new Date(today);
        currentDay.setDate(today.getDate() - i);
        const dayWeight = data.find(item => new Date(item.date).toDateString() === currentDay.toDateString())?.weight ?? null;
        last30Days.push({ date: currentDay.toISOString(), weight: dayWeight });
      }
      
      // Calculate weekly averages
      const weeklyAverages = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = i * 7;
        const weekEnd = Math.min(weekStart + 7, 30);
        const weekDays = last30Days.slice(weekStart, weekEnd);
        const validWeights = weekDays.map(d => d.weight).filter(w => w !== null && w !== undefined && w > 0);
        const weeklyAvg = validWeights.length > 0 ? validWeights.reduce((a, b) => a + b) / validWeights.length : 0;
        weeklyAverages.push(weeklyAvg);
      }
      
      const weekLabels = ['W1', 'W2', 'W3', 'W4'];
      dataSet = {
        labels: weekLabels,
        datasets: [{ data: weeklyAverages, strokeWidth: 2, color: () => colors.primaryOrange }],
        rawData: weeklyAverages.map((avg, index) => ({ date: new Date(today.getTime() - (3 - index) * 7 * 24 * 60 * 60 * 1000).toISOString(), weight: avg })),
      };
    }
    return dataSet;
  }, [data, chartPeriod]);

  const periodStats = useMemo(() => {
    const validWeights = chartData.rawData
      .map(item => item.weight)
      .filter(weight => weight !== null && weight !== undefined && weight > 0);
    
    if (validWeights.length === 0) {
      return { min: 0, max: 0, average: 0, change: 0 };
    }
    
    const change = validWeights.length > 1 ? validWeights[validWeights.length - 1] - validWeights[0] : 0;
    
    return {
      min: Math.min(...validWeights),
      max: Math.max(...validWeights),
      average: validWeights.reduce((a, b) => a + b, 0) / validWeights.length,
      change,
    };
  }, [chartData]);

  const getTrendIcon = () => {
    if (periodStats.change < -0.1) return 'trending-down';
    if (periodStats.change > 0.1) return 'trending-up';
    return 'trending-neutral';
  };

  const getTrendColor = () => {
    if (periodStats.change < -0.1) return colors.success;
    if (periodStats.change > 0.1) return colors.danger;
    return colors.secondaryText;
  };

  const chartConfig = {
    backgroundGradientFrom: '#151B23',
    backgroundGradientTo: '#151B23',
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    strokeWidth: 2,
    propsForDots: {
      r: chartPeriod === '7' ? '4' : '3',
      strokeWidth: '2',
      stroke: colors.primaryOrange,
      fill: '#151B23',
    },
    propsForBackgroundLines: {
      strokeDasharray: '3,3',
      stroke: 'rgba(255, 255, 255, 0.15)',
      strokeWidth: 0.5,
    },
    propsForLabels: {
      fontSize: normalize(8),
      fontWeight: '600',
    },
    decimalPlaces: 1,
    fillShadowGradient: colors.primaryOrange,
    fillShadowGradientOpacity: 0.01,
  };

  return (
    <Animated.View style={[styles.chartCard, { opacity: fadeAnim }]}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>
          {chartPeriod === '7' ? 'Weekly' : 'Monthly'} Progress
        </Text>
        <View style={styles.chartToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, chartPeriod === '7' && styles.toggleButtonActive]}
            onPress={() => setChartPeriod('7')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleButtonText, chartPeriod === '7' && styles.toggleButtonTextActive]}>
              7D
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, chartPeriod === '30' && styles.toggleButtonActive]}
            onPress={() => setChartPeriod('30')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleButtonText, chartPeriod === '30' && styles.toggleButtonTextActive]}>
              30D
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - normalize(40)}
            height={normalize(200)}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={true}
            withShadow={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            segments={3}
            yAxisSuffix=" kg"
            formatYLabel={(value) => parseFloat(value).toFixed(1)}
            fromZero={false}
            renderDotContent={({ x, y, index }) => {
              const value = chartData.datasets[0].data[index];
              if (!value || value === 0) return null;
              
              return (
                <SvgText
                  key={`label-${index}`}
                  x={x}
                  y={y - 8}
                  fill={colors.primaryOrange}
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {value.toFixed(1)}
                </SvgText>
              );
            }}
          />
        </View>
      </View>
      
      <View style={styles.chartFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>
            {periodStats.min ? periodStats.min.toFixed(1) : '--'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>
            {periodStats.max ? periodStats.max.toFixed(1) : '--'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>
            {periodStats.average ? periodStats.average.toFixed(1) : '--'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <View style={styles.trendStat}>
            <MaterialCommunityIcons 
              name={getTrendIcon()} 
              size={normalize(10)} 
              color={getTrendColor()}
            />
            <Text style={[styles.statValue, { color: getTrendColor() }]}>
              {periodStats.change > 0 ? '+' : ''}{periodStats.change.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: 'rgba(21, 27, 35, 0.8)',
    borderRadius: normalize(12),
    padding: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  chartTitle: {
    fontSize: normalize(18),
    color: colors.primaryText,
    fontWeight: '600',
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: normalize(6),
    padding: normalize(1.5),
  },
  toggleButton: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(5),
  },
  toggleButtonActive: {
    backgroundColor: colors.primaryOrange,
  },
  toggleButtonText: {
    fontSize: normalize(9),
    color: colors.secondaryText,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  chartWrapper: {
    marginBottom: normalize(2),
  },
  chartContainer: {
    alignItems: 'center',
    borderRadius: normalize(8),
    overflow: 'visible',
  },
  chart: {
    marginBottom: normalize(5),
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: normalize(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: normalize(2),
  },
  statLabel: {
    fontSize: normalize(8),
    color: colors.secondaryText,
    fontWeight: '00',
    textTransform: 'uppercase',
    marginBottom: normalize(2),
  },
  statValue: {
    fontSize: normalize(11),
    color: colors.primaryText,
    fontWeight: '700',
  },
  trendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(2),
  },
  statDivider: {
    width: 1,
    height: normalize(20),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default WeightChart;