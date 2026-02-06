import { FOOD_NAME } from '../theme';

const formatFoodName = (productName) => {
  const rawName = productName || 'No Name';
  let foodName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  foodName = foodName.replace(/[\-\,\.;:!?]+(\s*)$/, '').trim();

  if (foodName.length > FOOD_NAME.MAX_LENGTH) {
    const truncated = foodName.substring(0, FOOD_NAME.MAX_LENGTH);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > FOOD_NAME.MAX_LENGTH * FOOD_NAME.TRUNCATE_THRESHOLD) {
      foodName = truncated.substring(0, lastSpaceIndex);
    } else {
      foodName = truncated;
    }
    foodName = foodName.replace(/[\-\,\.;:!?]+(\s*)$/, '').trim();
  }

  return foodName;
};

export default formatFoodName;