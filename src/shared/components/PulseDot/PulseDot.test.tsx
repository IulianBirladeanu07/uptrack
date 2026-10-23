import { act, render } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import PulseDot from './PulseDot';

const mockLoops = () => {
    const loops: { start: jest.Mock; stop: jest.Mock; reset: jest.Mock }[] = [];
    jest.spyOn(Animated, 'loop').mockImplementation(() => {
        const loop = { start: jest.fn(), stop: jest.fn(), reset: jest.fn() };
        loops.push(loop);
        return loop;
    });
    return loops;
};

const settle = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe('PulseDot', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('keeps pulsing when reduced motion is off', async () => {
        jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
        const loops = mockLoops();

        render(<PulseDot style={{}} />);
        await settle();

        expect(loops).toHaveLength(1);
        expect(loops[0]!.start).toHaveBeenCalledTimes(1);
        expect(loops[0]!.stop).not.toHaveBeenCalled();
    });

    it('stops pulsing and does not restart when reduced motion is on', async () => {
        jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
        const loops = mockLoops();

        render(<PulseDot style={{}} />);
        await settle();

        expect(loops).toHaveLength(1);
        expect(loops[0]!.stop).toHaveBeenCalledTimes(1);
    });

    it('stops the loop when unmounted', async () => {
        jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
        const loops = mockLoops();

        const view = render(<PulseDot style={{}} />);
        await settle();
        view.unmount();

        expect(loops[0]!.stop).toHaveBeenCalledTimes(1);
    });
});
