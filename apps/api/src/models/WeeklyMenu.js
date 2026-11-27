import mongoose from "mongoose";
const { Schema } = mongoose;
const snapshot = new Schema(
  {
    title: String,
    image: String,
    servings: Number,
    capturedAt: Date,
    ingredients: [
      new Schema(
        {
          name: String,
          unit: String,
          quantity: Number,
          quantityType: String,
          note: String,
        },
        { _id: false },
      ),
    ],
  },
  { _id: false },
);
const item = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: "Recipe" },
    servings: Number,
    snapshot,
  },
  { _id: false },
);
const meal = new Schema(
  { day: Number, slot: String, items: [item] },
  { _id: false },
);
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true },
    weekStart: { type: String, required: true },
    version: Number,
    meals: [meal],
  },
  { timestamps: true },
);
// The unused scaffold collection had a unique user-only index. Leave it intact.
schema.index({ user: 1, weekStart: 1 }, { unique: true });
export const WeeklyMenu = mongoose.model(
  "WeeklyMenu",
  schema,
  "weeklymenus_by_week",
);
