// Built-in database of common Filipino foods. Values are typical per 100 g;
// home recipes vary (oil and fat cut make the biggest difference), so weigh when you can.
// serving = typical grams for one "serving" as usually eaten.

const F = (id, name, kcal, protein, carbs, fat, serving, servingLabel, tags = []) => ({
  id,
  name,
  per100: { kcal, protein, carbs, fat },
  serving,
  servingLabel,
  tags,
});

export const FOODS = [
  F('rice', 'White rice (cooked)', 130, 2.7, 28, 0.3, 160, '1 cup', ['rice', 'kanin']),
  F('sinangag', 'Garlic fried rice (sinangag)', 170, 3, 28, 5, 160, '1 cup', ['rice']),
  F('pandesal', 'Pandesal', 290, 9, 52, 5, 30, '1 piece', ['bread']),
  F('ensaymada', 'Ensaymada', 400, 8, 50, 18, 75, '1 piece', ['bread', 'snack']),
  F('puto', 'Puto', 200, 4, 42, 1.5, 40, '1 piece', ['snack']),
  F('chicken-adobo', 'Chicken adobo', 190, 18, 3, 12, 150, '1 serving', ['ulam', 'chicken']),
  F('pork-adobo', 'Pork adobo', 270, 17, 3, 21, 150, '1 serving', ['ulam', 'pork']),
  F('sinigang-baboy', 'Sinigang na baboy (with broth)', 70, 6, 3, 4, 350, '1 bowl', ['soup', 'pork']),
  F('tinola', 'Tinolang manok (with broth)', 60, 7, 2, 2.5, 350, '1 bowl', ['soup', 'chicken']),
  F('lechon-kawali', 'Lechon kawali', 480, 20, 0, 44, 100, '1 serving', ['pork']),
  F('fried-chicken', 'Fried chicken (with skin)', 260, 25, 8, 15, 120, '1 piece', ['chicken']),
  F('chicken-breast', 'Chicken breast (grilled)', 165, 31, 0, 3.6, 120, '1 fillet', ['chicken', 'protein']),
  F('longganisa', 'Longganisa (fried)', 330, 14, 12, 25, 80, '2 pieces', ['breakfast', 'pork']),
  F('tocino', 'Tocino (fried)', 300, 15, 25, 15, 80, '1 serving', ['breakfast', 'pork']),
  F('tapa', 'Beef tapa (fried)', 230, 25, 8, 11, 80, '1 serving', ['breakfast', 'beef']),
  F('fried-egg', 'Fried egg', 196, 13.6, 0.8, 15, 46, '1 egg', ['egg', 'breakfast']),
  F('boiled-egg', 'Boiled egg', 155, 13, 1.1, 11, 50, '1 egg', ['egg']),
  F('bangus-fried', 'Fried bangus', 230, 22, 0, 15, 120, '1 serving', ['fish']),
  F('corned-beef', 'Corned beef (sautéed)', 250, 25, 1, 16, 100, '1 serving', ['beef', 'canned']),
  F('luncheon-meat', 'Luncheon meat (fried)', 310, 13, 3, 27, 56, '2 slices', ['pork', 'canned']),
  F('hotdog', 'Red hotdog (fried)', 290, 10, 5, 26, 50, '1 piece', ['pork', 'breakfast']),
  F('pancit-canton', 'Pancit canton (cooked)', 180, 6, 25, 6, 200, '1 plate', ['noodles']),
  F('pancit-bihon', 'Pancit bihon (cooked)', 150, 5, 24, 4, 200, '1 plate', ['noodles']),
  F('lumpia-shanghai', 'Lumpiang shanghai', 280, 10, 20, 18, 20, '1 piece', ['pork', 'snack']),
  F('kare-kare', 'Kare-kare', 180, 12, 6, 12, 200, '1 serving', ['beef', 'ulam']),
  F('sisig', 'Pork sisig', 300, 15, 4, 25, 150, '1 serving', ['pork', 'ulam']),
  F('menudo', 'Menudo', 150, 11, 8, 8, 150, '1 serving', ['pork', 'ulam']),
  F('bicol-express', 'Bicol express', 320, 12, 5, 28, 150, '1 serving', ['pork', 'ulam']),
  F('laing', 'Laing', 180, 4, 8, 15, 150, '1 serving', ['veg', 'ulam']),
  F('chopsuey', 'Chopsuey', 70, 4, 6, 3.5, 200, '1 serving', ['veg']),
  F('monggo', 'Ginisang monggo', 110, 7, 14, 3, 250, '1 bowl', ['veg', 'beans']),
  F('champorado', 'Champorado (with milk)', 130, 3, 25, 2, 250, '1 bowl', ['breakfast', 'snack']),
  F('arroz-caldo', 'Arroz caldo', 90, 5, 13, 2, 300, '1 bowl', ['soup', 'rice']),
  F('siopao', 'Siopao asado', 250, 9, 38, 7, 120, '1 piece', ['snack']),
  F('siomai', 'Pork siomai', 220, 12, 15, 12, 25, '1 piece', ['snack']),
  F('kwek-kwek', 'Kwek-kwek', 250, 10, 20, 15, 25, '1 piece', ['snack', 'street food']),
  F('fishball', 'Fishball (fried)', 180, 8, 20, 8, 10, '1 piece', ['snack', 'street food']),
  F('turon', 'Turon', 250, 2, 40, 9, 80, '1 piece', ['snack', 'banana']),
  F('banana-cue', 'Banana cue', 220, 1, 45, 5, 150, '1 stick', ['snack', 'banana']),
  F('saba', 'Saba banana (boiled)', 120, 1, 31, 0.3, 80, '1 piece', ['fruit', 'banana']),
  F('banana', 'Banana (lakatan/latundan)', 89, 1.1, 23, 0.3, 100, '1 piece', ['fruit']),
  F('mango', 'Ripe mango', 60, 0.8, 15, 0.4, 200, '1 piece', ['fruit']),
  F('avocado', 'Avocado', 160, 2, 9, 15, 150, '½ fruit', ['fruit']),
  F('taho', 'Taho', 80, 3, 15, 1.5, 250, '1 cup', ['snack']),
  F('halo-halo', 'Halo-halo', 140, 2.5, 28, 2.5, 350, '1 glass', ['dessert']),
  F('peanut-butter', 'Peanut butter', 590, 25, 20, 50, 16, '1 tbsp', ['spread']),
  F('peanuts', 'Roasted peanuts (mani)', 585, 24, 21, 50, 30, '1 handful', ['snack']),
  F('whole-milk', 'Whole milk', 61, 3.2, 4.8, 3.3, 250, '1 glass', ['drink', 'dairy']),
  F('oats', 'Rolled oats (dry)', 389, 17, 66, 7, 40, '½ cup', ['breakfast']),
  F('gainer-shake', 'Homemade gainer shake (milk, banana, 2 tbsp PB, oats)', 139, 5.7, 16, 6.5, 422, '1 shake', ['drink', 'gain']),
  F('cooking-oil', 'Cooking oil', 884, 0, 0, 100, 14, '1 tbsp', ['oil']),
];


// Raw ingredients for the recipe builder (weigh before cooking).
export const RAW = [
  F('r-chicken-whole', 'Chicken, with skin (raw)', 215, 18.6, 0, 15, 1000, '1 kg', ['raw', 'chicken', 'manok']),
  F('r-chicken-breast', 'Chicken breast, skinless (raw)', 120, 22.5, 0, 2.6, 500, '500 g', ['raw', 'chicken', 'manok']),
  F('r-chicken-thigh', 'Chicken thigh, with skin (raw)', 220, 16.5, 0, 17, 500, '500 g', ['raw', 'chicken', 'manok']),
  F('r-pork-belly', 'Pork belly / liempo (raw)', 518, 9.3, 0, 53, 500, '500 g', ['raw', 'pork', 'baboy']),
  F('r-pork-kasim', 'Pork shoulder / kasim (raw)', 230, 17, 0, 18, 500, '500 g', ['raw', 'pork', 'baboy']),
  F('r-pork-ground', 'Ground pork (raw)', 263, 17, 0, 21, 500, '500 g', ['raw', 'pork', 'giniling']),
  F('r-beef', 'Beef, stewing cut (raw)', 200, 20, 0, 13, 500, '500 g', ['raw', 'beef', 'baka']),
  F('r-bangus', 'Bangus (raw)', 148, 20.5, 0, 6.7, 500, '1 fish', ['raw', 'fish', 'isda']),
  F('r-tilapia', 'Tilapia (raw)', 96, 20, 0, 1.7, 300, '1 fish', ['raw', 'fish', 'isda']),
  F('r-egg', 'Egg (raw)', 143, 12.6, 0.7, 9.5, 50, '1 egg', ['raw', 'egg', 'itlog']),
  F('r-rice', 'Rice, uncooked', 365, 7, 80, 0.7, 180, '1 rice-cooker cup', ['raw', 'rice', 'bigas']),
  F('r-potato', 'Potato (raw)', 77, 2, 17, 0.1, 150, '1 piece', ['raw', 'veg', 'patatas']),
  F('r-carrot', 'Carrot (raw)', 41, 0.9, 10, 0.2, 80, '1 piece', ['raw', 'veg']),
  F('r-cabbage', 'Cabbage / repolyo (raw)', 25, 1.3, 6, 0.1, 200, '¼ head', ['raw', 'veg']),
  F('r-onion', 'Onion / sibuyas (raw)', 40, 1.1, 9, 0.1, 80, '1 piece', ['raw', 'veg']),
  F('r-garlic', 'Garlic / bawang (raw)', 149, 6.4, 33, 0.5, 15, '1 head', ['raw', 'veg']),
  F('r-tomato', 'Tomato / kamatis (raw)', 18, 0.9, 3.9, 0.2, 80, '1 piece', ['raw', 'veg']),
  F('r-kangkong', 'Kangkong (raw)', 19, 2.6, 3.1, 0.2, 100, '1 bundle', ['raw', 'veg']),
  F('r-sitaw', 'Sitaw (raw)', 47, 2.8, 8, 0.4, 100, '1 bundle', ['raw', 'veg']),
  F('r-sayote', 'Sayote (raw)', 19, 0.8, 4.5, 0.1, 200, '1 piece', ['raw', 'veg']),
  F('r-papaya', 'Green papaya (raw)', 39, 0.6, 10, 0.1, 300, '½ piece', ['raw', 'veg']),
  F('r-soy', 'Soy sauce / toyo', 53, 8, 5, 0.6, 18, '1 tbsp', ['raw', 'sauce']),
  F('r-vinegar', 'Vinegar / suka', 18, 0, 0.9, 0, 15, '1 tbsp', ['raw', 'sauce']),
  F('r-oyster', 'Oyster sauce', 51, 1.4, 11, 0.3, 18, '1 tbsp', ['raw', 'sauce']),
  F('r-sugar', 'Sugar', 387, 0, 100, 0, 12, '1 tbsp', ['raw']),
  F('r-gata', 'Coconut milk / gata', 230, 2.3, 6, 24, 400, '1 can', ['raw', 'gata']),
  F('r-oil', 'Cooking oil', 884, 0, 0, 100, 14, '1 tbsp', ['raw', 'oil', 'mantika']),
  F('r-butter', 'Butter', 717, 0.9, 0.1, 81, 14, '1 tbsp', ['raw']),
  F('r-water', 'Water / broth (no calories)', 0, 0, 0, 0, 250, '1 cup', ['raw']),
];

export function searchRaw(q) {
  const s = q.trim().toLowerCase();
  if (!s) return RAW;
  return RAW.filter((f) => f.name.toLowerCase().includes(s) || f.tags.some((t) => t.includes(s)));
}

export function searchLocal(q, myFoods = []) {
  const s = q.trim().toLowerCase();
  const all = [...myFoods.map((f) => ({ ...f, mine: true })), ...FOODS];
  if (!s) return all.slice(0, 30);
  return all.filter(
    (f) => f.name.toLowerCase().includes(s) || (f.tags || []).some((t) => t.includes(s))
  );
}

// Cheap, calorie-dense add-ons that make a surplus easy to hit.
export const BOOSTERS = [
  { id: 'peanut-butter', grams: 32, label: '2 tbsp peanut butter on pandesal' },
  { id: 'gainer-shake', grams: 422, label: 'Gainer shake (milk + banana + PB + oats)' },
  { id: 'whole-milk', grams: 250, label: 'Glass of whole milk with a meal' },
  { id: 'peanuts', grams: 30, label: 'Handful of mani' },
  { id: 'rice', grams: 80, label: 'Extra ½ cup rice' },
  { id: 'boiled-egg', grams: 100, label: '2 boiled eggs (also protein)' },
  { id: 'banana-cue', grams: 150, label: 'Banana cue merienda' },
  { id: 'avocado', grams: 150, label: 'Avocado with milk & sugar' },
];

export function foodById(id) {
  return FOODS.find((f) => f.id === id);
}
