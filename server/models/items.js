import { v4 as uuidv4 } from 'uuid';
import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    flavor: {
        type: String,
        required: true,
    },
    material: {
        type: String,
        required: true,
    },
    materialdescription: {
        type: String,
        required: true,
    },
    netweight: {
        type: Number,
        required: true,
    },
    grossweight: {
        type: Number,
    },
    gst: {
        type: Number,
        required: true,
    },
    packaging: {
        type: String,
        enum: ['box', 'tin', 'jar'],
        default: 'box',
    },//id
    packsize: {
        type: String,

    },
    staticPrice: {
        type: Number,

    },
    itemId: {
        type: String,
        unique: true,
        default: uuidv4,
    },
    warehouses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
        }
    ],
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

const Item = mongoose.model('Item', itemSchema);
export default Item;
