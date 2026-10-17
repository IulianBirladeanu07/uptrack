export const applyWeightKey = (current: string, key: string, isFresh: boolean): string | null => {
    if (key === 'backspace') return current.slice(0, -1);

    const base = isFresh ? '' : current;
    if (key === '.') {
        if (base.includes('.')) return null;
        return base === '' ? '0.' : `${base}.`;
    }

    const [, decimals] = base.split('.');
    if (decimals != null && decimals.length >= 1) return null;
    if (base.replace('.', '').length >= 4) return null;
    return `${base}${key}`;
};
