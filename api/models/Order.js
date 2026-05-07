import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menu_id: String,
    name: String,
    variant: { type: String, default: null },
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer_name: { type: String, required: true },
    phone: { type: String, required: true },
    phone_verified: { type: Boolean, default: false },
    address: { type: String, default: "" },
    hostel: { type: String, required: true },
    room_number: { type: String, default: null },
    items: { type: [orderItemSchema], required: true },
    total_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    notes: { type: String, default: null },
    order_number: { type: Number },
  },
  { timestamps: true }
);

// Auto-increment order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.order_number) {
    const last = await mongoose
      .model("Order")
      .findOne()
      .sort({ order_number: -1 })
      .select("order_number");
    this.order_number = (last?.order_number ?? 0) + 1;
  }
  next();
});

export default mongoose.model("Order", orderSchema);
