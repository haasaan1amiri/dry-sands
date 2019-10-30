const {
    mongoose
} = require('../db/mongoose');
const userSchema = new mongoose.Schema({
    name: String,
    family: String,
    address: String,
    phoneNumber: String,
    mobileNumber: String,
    rank: Number,
    debt: Number,
    username: String,
    password: String,
    registerDay: {
        year: Number,
        month: Number,
        daymonth: Number
    },
    requestDay: {
        year: Number,
        month: Number,
        daymonth: Number
    },
    isNewOrder: Boolean,
    isShowPrice: Boolean,
    haveAccess: Boolean,
    activity: Boolean, // 0 is removed, 1 is accepted and registered, 2 is not accepted and register is pending
    dayliBuyCeil: Number,
    unRegisterId: String
});
module.exports = mongoose.model('user', userSchema, 'users');