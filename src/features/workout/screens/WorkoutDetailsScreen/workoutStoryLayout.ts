export const getWorkoutStorySize = (
    containerWidth: number,
    containerHeight: number,
) => {
    return {
        width: Math.max(1, containerWidth),
        height: Math.max(1, containerHeight),
    };
};

export const getWorkoutPhotoFrame = (
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
) => {
    const containScale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

    return {
        width: imageWidth * containScale,
        height: imageHeight * containScale,
    };
};
