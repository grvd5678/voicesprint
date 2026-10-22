const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'Software Engineer',
    },
    avatar: {
      type: String,
      default: '',
    },
    initials: {
      type: String,
      default: '',
    },
    aliases: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// Pre-save to auto-generate initials if not provided
UserSchema.pre('save', function () {
  if (!this.initials && this.name) {
    const parts = this.name.trim().split(/\s+/);
    this.initials = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
});

module.exports = mongoose.model('User', UserSchema);
