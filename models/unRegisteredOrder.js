const {
    mongoose
} = require('../db/mongoose');

var CounterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

var counter =mongoose.model('counter', CounterSchema, 'orderCounters');
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
    totalAmount: Number,
    orderNumber: Number
});

orderSchema.pre('save', function (next) {
    var doc = this;
    counter.findByIdAndUpdate({
        _id: 'entityId'
    }, {
        $inc: {
            seq: 1
        }
    }, function (error, counter) {
        if (error)
            return next(error);
        doc.orderNumber = counter.seq;
        next();
    });
});
module.exports = mongoose.model('tempOrder', orderSchema, 'tempOrders');