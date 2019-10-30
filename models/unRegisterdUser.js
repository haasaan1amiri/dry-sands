const {
    mongoose
} = require('../db/mongoose');
const userSchema = new mongoose.Schema({
    name: String,
    family: String,
    address: String,
    phoneNumber: String,
    mobileNumber: String,
    requestDay: {
        year: Number,
        month: Number,
        daymonth: Number
    }
});
module.exports = mongoose.model('tempUser', userSchema, 'tempUsers');