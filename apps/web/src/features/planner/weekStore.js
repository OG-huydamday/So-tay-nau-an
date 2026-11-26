import { configureStore, createSelector, createSlice } from "@reduxjs/toolkit";

export function monday(date) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
const fresh = (week) => ({
  week,
  version: 0,
  meals: [],
  status: "loading",
  error: "",
  dirty: false,
});
const slice = createSlice({
  name: "menu",
  initialState: fresh(monday(today())),
  reducers: {
    open: (_, a) => fresh(a.payload),
    loaded: (s, a) => {
      if (s.week === a.payload.weekStart)
        Object.assign(s, {
          version: a.payload.version,
          meals: a.payload.meals,
          status: "ready",
          error: "",
          dirty: false,
        });
    },
    saving: (s) => {
      s.status = "saving";
      s.error = "";
    },
    failure: (s, a) => {
      s.error = a.payload.message;
      s.status = a.payload.status;
    },
    edit: (s, a) => {
      const { day, slot, items } = a.payload;
      s.meals = s.meals.filter((m) => m.day !== day || m.slot !== slot);
      if (items.length) s.meals.push({ day, slot, items });
      s.dirty = true;
    },
  },
});
export const actions = slice.actions;
export const createMenuStore = () => configureStore({ reducer: slice.reducer });
export const shopping = createSelector(
  (s) => s.meals,
  (meals) => {
    let skipped = 0;
    const sums = new Map();
    for (const meal of meals)
      for (const item of meal.items) {
        if (!item.available) {
          skipped++;
          continue;
        }
        for (const ing of item.snapshot.ingredients) {
          const name = ing.name
            .normalize("NFC")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();
          const unit =
            ing.quantityType === "to-taste"
              ? null
              : (ing.unit || "").trim().toLowerCase();
          const key = JSON.stringify([name, unit]);
          const row = sums.get(key) ?? { key, name, unit, quantity: 0 };
          if (unit !== null)
            row.quantity +=
              (ing.quantity * item.servings) / item.snapshot.servings;
          sums.set(key, row);
        }
      }
    return {
      rows: [...sums.values()].sort((a, b) =>
        a.name.localeCompare(b.name, "vi"),
      ),
      skipped,
    };
  },
);
