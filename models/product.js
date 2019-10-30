const {
    mongoose
} = require('../db/mongoose');
const productSchema = new mongoose.Schema({
    name: String,
    imageUrls: Array,
    information: String,
    buyCeiling: Number,
    available: Number,
    price: Number
});
module.exports = mongoose.model('product', productSchema, 'productInfo');