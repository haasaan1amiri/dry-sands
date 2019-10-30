const {
    mongoose
} = require('../db/mongoose');
const paymentSchema = new mongoose.Schema({
    orderNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order'
    },
    amount: Number,
    information: String
});
module.exports = mongoose.model('payment', paymentSchema, 'payments');