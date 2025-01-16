import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
  {
    totalSaleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TotalSale",
      required: true,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
        },
        status: {
          type: String,
          enum: ["issued", "settled"],
          default: "issued",
        },
      },
    ],
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    creditNoteNumber: {
      type: String,
      required: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    transporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
    },
  },
  { timestamps: true }
);

const CreditNote = mongoose.model("CreditNote", creditNoteSchema);
export default CreditNote;
