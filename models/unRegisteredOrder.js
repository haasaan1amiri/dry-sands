const {
    mongoose
} = require('../db/mongoose');
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    products: Array,
    orderDay: {
        year: Number,
        month: Number,
        daymonth: Number
    },
    totalAmount: Number
});
module.exports = mongoose.model('tempOrder', orderSchema, 'tempOrders');