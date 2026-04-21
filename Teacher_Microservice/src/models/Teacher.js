const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    teacherId: { type: String, required: true, unique: true, trim: true },
    subject: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Teacher', teacherSchema);
