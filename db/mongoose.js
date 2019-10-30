var mongoose = require('mongoose');
const TAG = "mongoose ";
mongoose.Promise = global.Promise;
const options = {
  useNewUrlParser: true
};
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/managment', options).then(
  () => {
    console.log(TAG + "connected to mongoDB")
  },
  (err) => {
    console.log(TAG + "err: ", err);
  });
module.exports = {
  mongoose
};