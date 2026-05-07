import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: null },
    phone_verified: { type: Boolean, default: false },
    address: { type: String, default: null },
    hostel: { type: String, default: null },
    room_number: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
