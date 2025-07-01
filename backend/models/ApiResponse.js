const mongoose = require('mongoose');

const apiResponseSchema = new mongoose.Schema({
  response: { type: String, required: true },
  filename: { type: String },
  pages: { type: Number },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApiResponse', apiResponseSchema);
