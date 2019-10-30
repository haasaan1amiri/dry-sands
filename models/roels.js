const {
    mongoose
} = require('../db/mongoose');
const roleSchema = new mongoose.Schema({
    text: String
});
module.exports = mongoose.model('role', roleSchema, 'roles');