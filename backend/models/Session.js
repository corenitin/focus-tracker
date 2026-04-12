const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      default: 'Study',
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime:   { type: Date,   default: null },
    duration:  { type: Number, default: 0 },   // seconds
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    notes:           { type: String, trim: true, maxlength: [500], default: '' },
    pausedAt:        { type: Date,   default: null },
    totalPausedTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sessionSchema.virtual('formattedDuration').get(function () {
  const s = this.duration;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
});

sessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
