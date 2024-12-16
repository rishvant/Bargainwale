import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema({
  buyer: {
    type: String,
    required: true,
  },
  buyerCompany: {
    type: String,
    required: true,
  },
  buyerdeliveryAddress: {
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pinCode: {
      type: String,
    },
  },
  buyerContact: {
    type: String,
    required: true,
  },
  buyerEmail: {
    type: String,
    required: true,
  },
  buyerGstno: {
    type: String,
    required: true,
  },
  buyerGooglemaps: {
    type: String,
  },
  organization: {
    type: mongoose.Schema.ObjectId,
    ref: "Organization",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Buyer = mongoose.model('Buyer', buyerSchema);
export default Buyer;
