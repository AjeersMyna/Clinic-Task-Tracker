// backend/models/userModel.js
// This is an example. Please verify against your actual file content.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: { // This field is likely causing the 'username_1 dup key' error
      type: String,
      required: true,
      unique: true, // This is the crucial part that caused the E11000 error
    },
    email: {
      type: String,
      required: true,
      unique: true, // Email is also usually unique
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'staff', 'patient'], // Example roles
      default: 'patient', // Or 'doctor' based on your default logic
      required: true,
    },
    // Add other fields as per your design
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;