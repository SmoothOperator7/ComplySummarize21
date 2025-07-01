const mongoose = require('mongoose');

const apiResponseSchema = new mongoose.Schema({
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApiResponse', apiResponseSchema);
