import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import useReducedMotion from '../../hooks/useReducedMotion';

type PulseDotProps = {
    style: StyleProp<ViewStyle>;
};

const PulseDot = ({ style }: PulseDotProps) => {
    const reduceMotion = useReducedMotion();
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (reduceMotion) {
            scale.setValue(1);
            return undefined;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.4, duration: 600, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [scale, reduceMotion]);

    return <Animated.View style={[style, { transform: [{ scale }] }]} />;
};

export default PulseDot;
