import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  _id: { type: String, default: "main" },
  is_open: { type: Boolean, default: false },
});

// Always use a single document with _id = "main"
const RestaurantConfig = mongoose.model("RestaurantConfig", configSchema);

export async function getConfig() {
  let cfg = await RestaurantConfig.findById("main");
  if (!cfg) {
    cfg = await RestaurantConfig.create({ _id: "main", is_open: false });
  }
  return cfg;
}

export default RestaurantConfig;
