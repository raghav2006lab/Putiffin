import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["thali", "main", "sides", "beverage", "dessert"],
      default: "main",
    },
    unit: { type: String, default: "plate" },
    emoji: { type: String, default: "🍽️" },
    is_available: { type: Boolean, default: true },
    is_weighted: { type: Boolean, default: false },
    weight_options: {
      type: [{ label: String, grams: Number }],
      default: null,
    },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
