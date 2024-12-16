import mongoose from "mongoose";

const transportSchema = new mongoose.Schema({
    transport: {
        type: String,
        required: true,
    },
    transportType: {
        type: String,
        required: true,
    },
    transportContact: {
        type: String,
        required: true,
    },
    transportAgency: {
        type: String,
        required: true,
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
});

const Transport = mongoose.model('Transport', transportSchema);
export default Transport;
