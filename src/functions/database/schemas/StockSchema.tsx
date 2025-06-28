import { Schema, model, models } from "mongoose";

const StockSchema = new Schema({
    quantity: Number
}, { collection: 'stocks' });

delete models.Stock;
const Stock = models?.Stock || model("Stock", StockSchema);

export default Stock;