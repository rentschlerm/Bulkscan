export const C = {
  bg: '#0E1116',
  card: '#171B22',
  card2: '#1F2530',
  border: '#2A3140',
  text: '#F2F4F8',
  sub: '#9AA3B2',
  accent: '#3DDC97', // calories / primary
  protein: '#5AA9FF',
  carbs: '#FFB547',
  fat: '#FF6B8A',
  warn: '#FFB547',
  danger: '#FF5C5C',
};

export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export function guessMeal(date = new Date()) {
  const h = date.getHours();
  if (h < 10) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h >= 17 && h < 21) return 'Dinner';
  return 'Snacks';
}
