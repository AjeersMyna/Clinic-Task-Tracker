// backend/controllers/taskController.js

const asyncHandler = require('express-async-handler');
const Task = require('../models/taskModel');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
    let query = {};

    // Admins see all tasks. Doctors see tasks assigned to them and not rejected.
    if (req.user.role === 'admin') {
        // Admin can use filters
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }
        if (req.query.dueDateStart && req.query.dueDateEnd) {
            query.dueDate = {
                $gte: new Date(req.query.dueDateStart),
                $lte: new Date(req.query.dueDateEnd)
            };
        }
    } else { // Doctor role
        query.assignedTo = req.user._id;
        query.assignmentStatus = { $in: ['accepted', 'pending-acceptance'] }; // Doctors only see accepted or pending tasks
        if (req.query.status) { // Doctors can also filter by status for their own tasks
            query.status = req.query.status;
        }
    }

    let sort = {};
    if (req.query.sortBy && req.query.order) {
        sort[req.query.sortBy] = req.query.order === 'asc' ? 1 : -1;
    } else {
        sort.createdAt = -1; // Default sort by creation date descending
    }

    const tasks = await Task.find(query)
        .populate('assignedTo', 'name email') // Populate assignedTo with name and email
        .sort(sort);

    res.status(200).json(tasks);
});

// @desc    Set task
// @route   POST /api/tasks
// @access  Private (Admin Only)
const setTask = asyncHandler(async (req, res) => {
    if (!req.body.title || !req.body.description || !req.body.dueDate || !req.body.assignedTo) {
        res.status(400);
        throw new Error('Please add all required fields: title, description, dueDate, assignedTo');
    }

    // Ensure only admin can create tasks
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to create tasks.');
    }

    const task = await Task.create({
        title: req.body.title,
        description: req.body.description,
        status: req.body.status || 'pending',
        dueDate: req.body.dueDate,
        assignedTo: req.body.assignedTo,
        assignmentStatus: 'pending-acceptance', // New tasks are pending acceptance
        createdBy: req.user.id, // Record who created the task
    });

    res.status(200).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin or assigned Doctor)
const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check if user is admin OR the assigned doctor
    if (req.user.role !== 'admin' && task.assignedTo.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this task.');
    }

    let updateData = { ...req.body };

    if (req.user.role !== 'admin') {
        // Doctors can only update the 'status' field (and maybe 'description' if allowed)
        const allowedDoctorUpdates = ['status'];
        const receivedKeys = Object.keys(req.body);
        const disallowedKeys = receivedKeys.filter(key => !allowedDoctorUpdates.includes(key));

        if (disallowedKeys.length > 0) {
            res.status(403);
            throw new Error(`Doctors can only update task status. Disallowed fields: ${disallowedKeys.join(', ')}`);
        }
        // Ensure doctor isn't trying to change assignment status here
        delete updateData.assignmentStatus;
    } else {
        // Admin can update all fields
        // Admin cannot directly change assignmentStatus using this route (use specific accept/reject routes)
        delete updateData.assignmentStatus;
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true, // Run Mongoose validators
    }).populate('assignedTo', 'name email');

    res.status(200).json(updatedTask);
});


// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin Only)
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Ensure only admin can delete tasks
    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to delete tasks.');
    }

    await Task.deleteOne({ _id: req.params.id });

    res.status(200).json({ id: req.params.id });
});

// @desc    Doctor accepts task
// @route   PUT /api/tasks/:id/accept
// @access  Private (Doctor Only)
const acceptTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check if the current user is the assigned doctor and status is pending-acceptance
    if (req.user.role === 'doctor' && task.assignedTo.toString() === req.user.id && task.assignmentStatus === 'pending-acceptance') {
        task.assignmentStatus = 'accepted';
        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } else {
        res.status(403);
        throw new Error('Not authorized or task not in pending-acceptance status.');
    }
});

// @desc    Doctor rejects task
// @route   PUT /api/tasks/:id/reject
// @access  Private (Doctor Only)
const rejectTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    const { rejectionReason } = req.body;

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // Check if the current user is the assigned doctor and status is pending-acceptance
    if (req.user.role === 'doctor' && task.assignedTo.toString() === req.user.id && task.assignmentStatus === 'pending-acceptance') {
        task.assignmentStatus = 'rejected';
        task.rejectionReason = rejectionReason || 'No reason provided.';
        const updatedTask = await task.save();
        res.status(200).json(updatedTask);
    } else {
        res.status(403);
        throw new Error('Not authorized or task not in pending-acceptance status.');
    }
});

// @desc    Doctor requests a due date change for a task
// @route   PUT /api/tasks/:id/request-date-change
// @access  Private (Doctor Only)
const requestDateChange = asyncHandler(async (req, res) => {
    // This is a placeholder function. You'll implement the actual logic here.
    // Example: Doctor sends a new requestedDueDate and a reason.
    const task = await Task.findById(req.params.id);
    const { requestedDueDate, requestReason } = req.body;

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (req.user.role !== 'doctor' || task.assignedTo.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to request a date change for this task.');
    }

    // Add logic to save the request (e.g., to the task model, or a separate request model)
    // For now, let's just update the task with pending request status and new date
    task.dateChangeRequest = {
        status: 'pending',
        requestedDate: new Date(requestedDueDate),
        reason: requestReason,
        requestedBy: req.user.id,
        requestDate: new Date()
    };
    await task.save();

    res.status(200).json({ message: 'Date change request submitted for review.', task });
});

// @desc    Admin reviews/approves/rejects a date change request
// @route   PUT /api/tasks/:id/review-date-change
// @access  Private (Admin Only)
const reviewDateChange = asyncHandler(async (req, res) => {
    // This is a placeholder function. You'll implement the actual logic here.
    // Example: Admin sends approval status (approved/rejected) and an optional admin reason.
    const task = await Task.findById(req.params.id);
    const { approvalStatus, adminReason } = req.body; // approvalStatus: 'approved' or 'rejected'

    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    if (req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized to review date change requests.');
    }

    if (!task.dateChangeRequest || task.dateChangeRequest.status !== 'pending') {
        res.status(400);
        throw new Error('No pending date change request for this task.');
    }

    if (approvalStatus === 'approved') {
        task.dueDate = task.dateChangeRequest.requestedDate; // Update the actual due date
        task.dateChangeRequest.status = 'approved';
        task.dateChangeRequest.adminNotes = adminReason;
        task.dateChangeRequest.reviewDate = new Date();
        task.dateChangeRequest.reviewedBy = req.user.id;
    } else if (approvalStatus === 'rejected') {
        task.dateChangeRequest.status = 'rejected';
        task.dateChangeRequest.adminNotes = adminReason;
        task.dateChangeRequest.reviewDate = new Date();
        task.dateChangeRequest.reviewedBy = req.user.id;
    } else {
        res.status(400);
        throw new Error('Invalid approvalStatus. Must be "approved" or "rejected".');
    }

    await task.save();

    res.status(200).json({ message: `Date change request ${approvalStatus}.`, task });
});

module.exports = {
    getTasks,
    setTask,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    requestDateChange,
    reviewDateChange,
};