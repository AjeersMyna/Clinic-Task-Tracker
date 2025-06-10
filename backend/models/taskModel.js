// backend/models/taskModel.js

const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Please add a due date'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign the task to a doctor'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignmentStatus: {
      type: String,
      enum: ['pending-acceptance', 'accepted', 'rejected'],
      default: 'pending-acceptance',
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    // NEW FIELD: Requested Due Date
    requestedDueDate: {
        type: Date,
        default: null,
    },
    // NEW FIELD: Status of the date change request
    dateChangeRequestStatus: {
        type: String,
        enum: ['none', 'pending-admin-review', 'approved', 'rejected'],
        default: 'none',
    },
    // NEW FIELD: Reason for the date change request
    dateChangeRequestReason: {
        type: String,
        default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);