const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-use', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  numberOfParticipants: {
    type: Number,
    required: true
  },
  notes: String,
  autoReleasedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-release booking after 10 minutes if not checked in
BookingSchema.pre('save', async function(next) {
  if (this.status === 'pending') {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (this.startTime < tenMinutesAgo) {
      this.status = 'cancelled';
      this.autoReleasedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
