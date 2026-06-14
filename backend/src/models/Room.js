const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  building: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  equipment: {
    projector: Boolean,
    whiteboard: Boolean,
    videoConferencing: Boolean,
    wifi: Boolean,
    airConditioning: Boolean,
    microphone: Boolean,
    other: [String]
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  description: String,
  image: String,
  bookingPolicy: {
    maxHoursPerDay: { type: Number, default: 4 },
    maxAdvanceDays: { type: Number, default: 30 },
    autoReleaseMinutes: { type: Number, default: 10 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', RoomSchema);
