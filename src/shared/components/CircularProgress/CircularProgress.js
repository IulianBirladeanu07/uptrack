import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, Animated } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { TouchableOpacity } from "react-native";
import { normalize } from "../../hooks/useResponsive";

const CircularProgress = ({
  value,
  maxValue,
  size = 100,
  strokeWidth = 10,
  color = "#FF7043",
  trailColor = "#D3D3D3",
  duration = 1400,
  measure = "KCAL",
  hasTargets = false,
  daysLogged = 0,
  requiredDays = 7,
  weeklyAvgCalories = 0,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const [currentView, setCurrentView] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Learning mode logic
  const isLearningMode = !hasTargets;
  const learningProgress = Math.min(daysLogged / requiredDays, 1);
  const daysRemaining = Math.max(requiredDays - daysLogged, 0);
  const isLearningComplete = daysLogged >= requiredDays;

  // Target mode logic
  const isOverconsumed = hasTargets && value > maxValue;
  const absoluteValue = hasTargets ? (isOverconsumed ? value - maxValue : maxValue - value) : value;
  const percentage = hasTargets && maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  // Calculate progress (0 to 1)
  let progress;
  if (isLearningMode) {
    progress = learningProgress;
  } else {
    progress = hasTargets && maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  }

  const getProgressColor = () => {
    if (isLearningMode) {
      // if (learningProgress < 0.3) return "#9CA3AF";
      // if (learningProgress < 0.7) return "#F59E0B";
      // if (isLearningComplete) return "#10B981";
      return "#FFA726";
    }
    
    if (isOverconsumed) return "#FFC107";
    if (percentage > 90) return "#FF9800";
    if (percentage > 70) return "#FFC107";
    return color;
  };

  const progressColor = getProgressColor();

  // Simple animation - just animate to the progress value
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress, duration]);

  // Calculate stroke dash offset from animated value
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, Math.max(0, circumference * 0.02)], // Leave 2% visible at minimum
  });

  const changeView = () => {
    const maxViews = isLearningMode ? 3 : 2;
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentView((prev) => (prev >= maxViews - 1 ? 0 : prev + 1));
    });
  };

  const dynamicStyles = {
    mainValue: { fontSize: size / 5 },
    statusText: { fontSize: size / 11 },
    statusTextAlt: { fontSize: size / 12 },
    progressText: { fontSize: size / 14 },
  };

  const renderIndicators = () => {
    const indicatorCount = isLearningMode ? 3 : 2;
    return (
      <View style={styles.indicatorContainer}>
        {Array.from({ length: indicatorCount }, (_, index) => (
          <View 
            key={index}
            style={[
              styles.indicator, 
              currentView === index ? styles.indicatorActive : styles.indicatorInactive
            ]} 
          />
        ))}
      </View>
    );
  };

  const renderLearningView = () => {
    switch (currentView) {
      case 0:
        return (
          <View style={styles.textContainer}>
            <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
              {Math.round(value)}
            </Text>
            <Text style={[styles.statusText, dynamicStyles.statusText]}>
              {measure} LOGGED
            </Text>
            {renderIndicators()}
          </View>
        );
      case 1:
        return (
          <View style={styles.textContainer}>
            <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
              {daysLogged}
            </Text>
            <Text style={[styles.statusText, dynamicStyles.statusText]}>
              {daysLogged === 1 ? "DAY LOGGED" : "DAYS LOGGED"}
            </Text>
            <Text style={[styles.progressText, dynamicStyles.progressText]}>
              {daysRemaining > 0 ? `${daysRemaining} to go` : "Ready for targets!"}
            </Text>
            {renderIndicators()}
          </View>
        );
      case 2:
        return (
          <View style={styles.textContainer}>
            {isLearningComplete && weeklyAvgCalories > 0 ? (
              <>
                <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
                  {Math.round(weeklyAvgCalories)}
                </Text>
                <Text style={[styles.statusText, dynamicStyles.statusText]}>
                  WEEKLY AVG
                </Text>
                <Text style={[styles.progressText, dynamicStyles.progressText]}>
                  Analysis complete!
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
                  {Math.round(learningProgress * 100)}%
                </Text>
                <Text style={[styles.statusText, dynamicStyles.statusText]}>
                  LEARNING
                </Text>
                <Text style={[styles.progressText, dynamicStyles.progressText]}>
                  Building your profile
                </Text>
              </>
            )}
            {renderIndicators()}
          </View>
        );
      default:
        return null;
    }
  };

  const renderTargetView = () => {
    switch (currentView) {
      case 0:
        return (
          <View style={styles.textContainer}>
            <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
              {Math.round(absoluteValue)}
            </Text>
            <Text style={[styles.statusText, dynamicStyles.statusText]}>
              {isOverconsumed ? `${measure} OVER` : `${measure} LEFT`}
            </Text>
            {renderIndicators()}
          </View>
        );
      case 1:
        return (
          <View style={styles.textContainer}>
            <Text style={[styles.mainValue, dynamicStyles.mainValue]}>
              {Math.round(percentage)}%
            </Text>
            <Text style={[styles.statusText, dynamicStyles.statusTextAlt]}>
              COMPLETE
            </Text>
            <Text style={[styles.progressText, dynamicStyles.progressText]}>
              {Math.round(value)} / {Math.round(maxValue)}
            </Text>
            {renderIndicators()}
          </View>
        );
      default:
        return null;
    }
  };

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <TouchableOpacity onPress={changeView} style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Trail circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trailColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            fill="transparent"
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </View>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        { isLearningMode ? renderLearningView() : renderTargetView()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  svgContainer: {
    position: "relative",
  },
  contentContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
  },
  mainValue: {
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center",
  },
  statusText: {
    color: "#BDBDBD",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: normalize(5),
  },
  progressText: {
    color: "#E0E0E0",
    textAlign: "center",
    fontWeight: "500",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: normalize(8),
  },
  indicator: {
    width: normalize(5),
    height: normalize(5),
    borderRadius: normalize(5),
    marginHorizontal: normalize(3),
  },
  indicatorActive: {
    backgroundColor: "#ffffff",
  },
  indicatorInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});

export default CircularProgress;