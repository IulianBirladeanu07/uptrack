import type { FoodFormData } from '../../../shared/types';

export type NutritionLabelFields = Partial<Pick<
  FoodFormData,
  'calories' | 'carbohydrates' | 'protein' | 'fats' | 'fiber' | 'sugar' | 'saturatedFats' | 'salt'
>>;

export type ParsedNutritionLabel = {
  fields: NutritionLabelFields;
  amount: string;
  unit: 'g' | 'ml' | 'serving';
};

type Nutrient = keyof NutritionLabelFields;
type ValueCandidate = { value: number; unit: string };

const LABELS: Record<Nutrient, RegExp> = {
  calories: /\b(?:energy|calories?|kcal)\b/i,
  carbohydrates: /\b(?:total\s*)?(?:carbohydrates?|carbs?)\b/i,
  protein: /\bprotein\b/i,
  fats: /\b(?:total\s*)?fat\b/i,
  fiber: /\b(?:dietary\s*)?(?:fiber|fibre)\b/i,
  sugar: /\b(?:total\s*)?sugars?\b/i,
  saturatedFats: /\b(?:(?:saturated|sat\.?)\s*fat|saturates)\b/i,
  salt: /\b(?:salt|sodium)\b/i,
};

const LABEL_BOUNDARY = /\b(?:energy|calories?|kcal|carbohydrates?|carbs?|protein|fat|fiber|fibre|sugars?|saturates|salt|sodium)\b/i;
const NUMBER_WITH_UNIT = /(\d+(?:[.,]\d+)?)\s*(kcal|kj|g|mg|%|ml)?/gi;

const parseNumber = (value: string): number => Number(value.replace(',', '.'));

const findCandidates = (text: string): ValueCandidate[] => {
  const candidates: ValueCandidate[] = [];
  for (const match of text.matchAll(NUMBER_WITH_UNIT)) {
    const value = parseNumber(match[1]);
    if (Number.isFinite(value) && value >= 0) {
      candidates.push({ value, unit: (match[2] || '').toLowerCase() });
    }
  }
  return candidates;
};

const valueForNutrient = (nutrient: Nutrient, candidates: ValueCandidate[], label: string): number | null => {
  const usable = candidates.filter(candidate => candidate.unit !== '%');
  if (nutrient === 'calories') {
    const kcal = usable.find(candidate => candidate.unit === 'kcal');
    if (kcal) return kcal.value;
    const kj = usable.find(candidate => candidate.unit === 'kj');
    if (kj) return Math.round(kj.value / 4.184);
    if (/\b(?:calories?|kcal)\b/i.test(label)) return usable.find(candidate => !candidate.unit)?.value ?? null;
    return null;
  }

  if (nutrient === 'salt' && /\bsodium\b/i.test(label)) {
    const sodium = usable.find(candidate => candidate.unit === 'mg' || candidate.unit === 'g');
    if (sodium) return sodium.unit === 'mg' ? (sodium.value * 2.5) / 1000 : sodium.value * 2.5;
    return null;
  }

  const grams = usable.find(candidate => candidate.unit === 'g');
  if (grams) return grams.value;
  const milligrams = usable.find(candidate => candidate.unit === 'mg');
  if (milligrams) return milligrams.value / 1000;
  return usable.find(candidate => !candidate.unit)?.value ?? null;
};

const findNutrientValue = (lines: string[], nutrient: Nutrient): number | null => {
  const labelPattern = LABELS[nutrient];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const labelMatch = labelPattern.exec(line);
    if (!labelMatch) continue;
    if (nutrient === 'fats' && /(?:saturated|sat\.?)\s*$/i.test(line.slice(0, labelMatch.index))) {
      continue;
    }

    const afterLabel = line.slice(labelMatch.index + labelMatch[0].length);
    const nextLabel = LABEL_BOUNDARY.exec(afterLabel);
    const valueText = nextLabel ? afterLabel.slice(0, nextLabel.index) : afterLabel;
    const candidates = findCandidates(valueText);
    if (candidates.length) {
      const value = valueForNutrient(nutrient, candidates, line);
      if (value !== null) return value;
    }

    const nextLineCandidates = findCandidates(lines[index + 1] || '');
    const nextLineValue = valueForNutrient(nutrient, nextLineCandidates, line);
    if (nextLineValue !== null) return nextLineValue;
  }
  return null;
};

const getServingBasis = (text: string): { amount: string; unit: ParsedNutritionLabel['unit'] } => {
  const perHundred = /\bper\s*100\s*(g|ml)\b/i.exec(text);
  if (perHundred) return { amount: '100', unit: perHundred[1].toLowerCase() as 'g' | 'ml' };

  const lines = text.split(/\r?\n/);
  const servingSizeIndex = lines.findIndex(line => /\b(?:serving\s*size|portion)\b/i.test(line));
  const servingSizeText = servingSizeIndex >= 0
    ? lines.slice(servingSizeIndex, servingSizeIndex + 2).join(' ')
    : '';
  const sizeCandidates = [...servingSizeText.matchAll(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/gi)];
  const size = sizeCandidates[sizeCandidates.length - 1];
  const servingBasis = /\bper\s*serving\b/i.test(text) || servingSizeIndex >= 0;
  if (servingBasis) {
    if (size) return { amount: size[1].replace(',', '.'), unit: size[2].toLowerCase() as 'g' | 'ml' };
    return { amount: '1', unit: 'serving' };
  }

  return { amount: '100', unit: 'g' };
};

export const parseNutritionLabel = (recognizedText: string): ParsedNutritionLabel | null => {
  const lines = recognizedText
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const fields: NutritionLabelFields = {};
  (Object.keys(LABELS) as Nutrient[]).forEach(nutrient => {
    const value = findNutrientValue(lines, nutrient);
    if (value !== null) fields[nutrient] = String(Number(value.toFixed(2)));
  });

  if (!fields.calories && !fields.carbohydrates && !fields.protein && !fields.fats) return null;

  return { fields, ...getServingBasis(recognizedText) };
};
