export const convertCmToFtIn = (cm: number): { feet: number; inches: number } => {
    const totalInches = Math.round(cm / 2.54);
    return {
        feet: Math.floor(totalInches / 12),
        inches: totalInches % 12,
    };
};
