import { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CHART_CONFIG = {
  backgroundGradientFrom: colors.background.secondary,
  backgroundGradientTo: colors.background.secondary,
  color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
  propsForDots: {
    r: '3',
    fill: colors.accent.primary,
  },
  propsForBackgroundLines: {
    stroke: colors.border.light,
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 8,
    fontWeight: '700',
  },
  decimalPlaces: 1,
  fillShadowGradient: colors.accent.primary,
  fillShadowGradientOpacity: 0.2,
};

const WeightChart = ({ data }) => {
  const [chartPeriod, setChartPeriod] = useState('30');
  const fadeAnim = useRef(null);

  if (!fadeAnim.current) {
    fadeAnim.current = new Animated.Value(1);
  }

  useEffect(() => {
    fadeAnim.current.setValue(0);
    Animated.timing(fadeAnim.current, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [chartPeriod]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [{ data: [0] }], rawData: [] };
    }

    const validData = data
      .filter(item => item.weight && item.weight > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (validData.length === 0) {
      return { labels: [], datasets: [{ data: [0] }], rawData: [] };
    }

    const periods = {
      '7': {
        slice: -7,
        labelFilter: () => true,
        dateFormat: { month: 'short', day: 'numeric' }
      },
      '30': {
        slice: -30,
        labelFilter: (_, index, arr) => index % 5 === 0 || index === arr.length - 1,
        dateFormat: { month: 'short', day: 'numeric' }
      },
      '365': {
        slice: -365,
        labelFilter: (_, index) => index % 60 === 0,
        dateFormat: { month: 'short' }
      }
    };

    const period = periods[chartPeriod];
    const periodData = validData.slice(period.slice);

    return {
      labels: periodData.map((item, index, arr) => {
        if (!period.labelFilter(item, index, arr)) return '';
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', period.dateFormat);
      }),
      datasets: [{ data: periodData.map(item => item.weight) }],
      rawData: periodData,
    };
  }, [data, chartPeriod]);

  if (chartData.rawData.length === 0) {
    return (
      <View style={styles.chartCard}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No weight data</Text>
          <Text style={styles.emptySubtitle}>Start logging to see your progress</Text>
        </View>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - (spacing[4] * 2);

  return (
    <Animated.View style={[styles.chartCard, { opacity: fadeAnim.current }]}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Progress</Text>
        <View style={styles.chartToggle}>
          {['7', '30', '365'].map((period, idx) => (
            <TouchableOpacity
              key={period}
              style={[styles.toggleButton, chartPeriod === period && styles.toggleButtonActive]}
              onPress={() => setChartPeriod(period)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleButtonText, chartPeriod === period && styles.toggleButtonTextActive]}>
                {['Week', 'Month', 'Year'][idx]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={180}
          chartConfig={CHART_CONFIG}
          withDots={true}
          withShadow={true}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          segments={4}
          fromZero={false}
          style={styles.chart}
          bezier={true}
          yAxisInterval={1}
          formatYLabel={(value) => {
            const num = typeof value === 'string' ? parseFloat(value) : value;
            return `${num.toFixed(1)}`;
          }}
        />
      </View>
    </Animated.View>
  );
};

const styles = createStyles(() => ({
  chartCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  chartTitle: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: radius[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[1],
  },
  toggleButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  toggleButtonActive: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius[2],
  },
  toggleButtonText: {
    fontSize: fontSize[10],
    color: colors.text.quaternary,
    fontWeight: fontWeight.medium,
  },
  toggleButtonTextActive: {
    color: colors.accent.buttonText,
    fontWeight: fontWeight.semibold,
  },
  chartWrapper: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  chart: {
    borderRadius: radius[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    fontSize: fontSize[16],
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[1],
  },
  emptySubtitle: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
}));

export default WeightChart;