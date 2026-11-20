export function mergeIngredients(ingredients) {
  return Object.values(ingredients.reduce((acc, item) => {
    const name = item.name.trim().toLowerCase();
    const unit = item.unit.trim().toLowerCase();
    const key = `${name}::${unit}`;
    if (!acc[key]) acc[key] = { name, unit, quantity: 0 };
    acc[key].quantity += Number(item.quantity || 0);
    return acc;
  }, {})).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

