import { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const CategorySelector = ({ selectedCategory, setSelectedCategory, loading }) => {
  const categories = ['Frequent', 'Recent', 'Favorites'];
  const scaleAnims = useRef(categories.map(() => new Animated.Value(1))).current;
  const bgAnims = useRef(categories.map(() => new Animated.Value(0))).current;
  const skeletonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonOpacity, {
            toValue: 0.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      skeletonOpacity.stopAnimation();
    }

    return () => {
      skeletonOpacity.stopAnimation();
    };
  }, [loading]);

  useEffect(() => {
    // Animate background based on selection
    bgAnims.forEach((anim, index) => {
      const isSelected = selectedCategory === categories[index];
      Animated.spring(anim, {
        toValue: isSelected ? 1 : 0,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }).start();
    });
  }, [selectedCategory]);

  const handlePressIn = (index) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 500,
      friction: 10,
    }).start();
  };

  const handlePressOut = (index) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 500,
      friction: 10,
    }).start();
  };

  const handlePress = (category, index) => {
    if (selectedCategory !== category) {
      setSelectedCategory(category);
    }
    handlePressOut(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.pillContainer}>
          {categories.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.skeletonPill,
                { opacity: skeletonOpacity }
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pillContainer}>
        {categories.map((category, index) => {
          const isSelected = selectedCategory === category;
          const bgColor = bgAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(15, 23, 42, 0)', '#FF9500']
          });
          
          return (
            <Animated.View
              key={category}
              style={[
                styles.pillWrapper,
                { transform: [{ scale: scaleAnims[index] }] }
              ]}
            >
              <TouchableOpacity
                onPress={() => handlePress(category, index)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={0.9}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: bgColor,
                      borderColor: isSelected ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
                    }
                  ]}
                >
                  <Text style={[
                    styles.pillText,
                    isSelected ? styles.selectedPillText : styles.inactivePillText
                  ]}>
                    {category}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: normalize(10),
  },
  pillContainer: {
    flexDirection: 'row',
    gap: normalize(8),
    justifyContent: 'flex-start',
  },
  pill: {
    paddingVertical: normalize(10),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(12),
    borderWidth: 1,
    minHeight: normalize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: normalize(14),
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  selectedPillText: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  inactivePillText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  skeletonPill: {
    backgroundColor: 'rgba(30, 41, 59, 1)',
    borderRadius: normalize(12),
    height: normalize(40),
    width: normalize(90),
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 1)',
  },
});

export default CategorySelector;