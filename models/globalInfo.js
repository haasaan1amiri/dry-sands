const {
    mongoose
} = require('../db/mongoose');
const infoSchema = new mongoose.Schema({
    globalNewOrder: Boolean,
    globalShowPrice: Boolean,
    globalHaveAccess: Boolean,
    globalDayliBuyCeil: Number
});
module.exports = mongoose.model('globalInfo', infoSchema, 'globalInfos');