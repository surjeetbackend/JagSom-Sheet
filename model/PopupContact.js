
const mongoose = require('mongoose');

const popupContactSchema = new mongoose.Schema({
  quotationNumber: String,
  name: String,
  phone: String,
  email: String,
  service: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PopupContact', popupContactSchema);
