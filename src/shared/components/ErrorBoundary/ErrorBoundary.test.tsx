import { Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ErrorBoundary from './ErrorBoundary';

jest.mock('expo-updates', () => ({ reloadAsync: jest.fn() }));

const Boom = ({ explode }: { explode: boolean }) => {
    if (explode) throw new Error('render failed');
    return <Text>content</Text>;
};

describe('ErrorBoundary', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('renders its children when nothing fails', () => {
        render(<ErrorBoundary><Boom explode={false} /></ErrorBoundary>);

        expect(screen.getByText('content')).toBeTruthy();
        expect(screen.queryByText('Something went wrong')).toBeNull();
    });

    it('replaces a crashing tree with the restart screen and logs the error', () => {
        render(<ErrorBoundary><Boom explode /></ErrorBoundary>);

        expect(screen.getByText('Something went wrong')).toBeTruthy();
        expect(screen.queryByText('content')).toBeNull();
        expect(errorSpy).toHaveBeenCalledWith('RENDER_ERROR:', 'render failed', expect.any(String), expect.any(String));
    });

    it('restarts the app from the button', async () => {
        const onRestart = jest.fn().mockResolvedValue(undefined);
        render(<ErrorBoundary onRestart={onRestart}><Boom explode /></ErrorBoundary>);

        fireEvent.press(screen.getByText('Restart'));

        await waitFor(() => expect(onRestart).toHaveBeenCalledTimes(1));
        expect(screen.getByText('Something went wrong')).toBeTruthy();
    });

    it('tries rendering again when the restart is not available', async () => {
        const onRestart = jest.fn().mockRejectedValue(new Error('updates disabled'));
        let explode = true;
        const Flaky = () => <Boom explode={explode} />;
        render(<ErrorBoundary onRestart={onRestart}><Flaky /></ErrorBoundary>);

        explode = false;
        fireEvent.press(screen.getByText('Restart'));

        expect(await screen.findByText('content')).toBeTruthy();
    });
});
