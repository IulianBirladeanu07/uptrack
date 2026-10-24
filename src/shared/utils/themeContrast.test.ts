import { colors } from '../theme/colors';

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string): number => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('small text contrast', () => {
  it('keeps secondary and tertiary text readable on card backgrounds', () => {
    expect(contrast(colors.text.secondary, colors.background.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.text.tertiary, colors.background.secondary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.text.tertiary, colors.background.primary)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('navigation label contrast', () => {
  it('keeps the inactive bottom navigation label readable on its background', () => {
    expect(contrast(colors.text.tertiary, colors.background.secondary)).toBeGreaterThanOrEqual(4.5);
  });

  it('documents that quaternary text is too faint for small labels', () => {
    expect(contrast(colors.text.quaternary, colors.background.secondary)).toBeLessThan(4.5);
  });
});

describe('progress ring track', () => {
  it('is visible against the card without competing with the progress arc', () => {
    const onCard = contrast(colors.background.track, colors.background.secondary);

    expect(onCard).toBeGreaterThanOrEqual(1.3);
    expect(onCard).toBeLessThanOrEqual(2);
    expect(contrast(colors.accent.primary, colors.background.secondary)).toBeGreaterThan(onCard * 3);
  });
});
