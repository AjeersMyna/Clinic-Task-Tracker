// backend/routes/taskRoutes.js

const express = require('express');
const router = express.Router();
const {
    getTasks,
    setTask,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    requestDateChange,
    reviewDateChange
} = require('../controllers/taskController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Task = require('../models/taskModel'); // ADD THIS LINE: Import the Task model

// @route   GET /api/tasks
// @desc    Get all tasks (with filtering and sorting)
// @access  Private (Admin & Doctor)
router.get('/', protect, authorizeRoles('admin', 'doctor'), getTasks);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (Admin Only - Admin allots appointments)
router.post('/', protect, authorizeRoles('admin'), setTask);

// @route   PUT /api/tasks/:id
// @desc    Update a task by ID
// @access  Private (Admin & Doctor - Doctor can update status if accepted; Admin can update anything)
router.put('/:id', protect, authorizeRoles('admin', 'doctor'), updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task by ID
// @access  Private (Admin Only)
router.delete('/:id', protect, authorizeRoles('admin'), deleteTask);

// ROUTES FOR TASK ACCEPTANCE/REJECTION
router.put('/:id/accept', protect, authorizeRoles('doctor'), acceptTask);
router.put('/:id/reject', protect, authorizeRoles('doctor'), rejectTask);

// NEW ROUTES FOR DATE CHANGE REQUESTS

// @route   PUT /api/tasks/:id/request-date-change
// @desc    Doctor requests a due date change for a task
// @access  Private (Doctor Only)
router.put('/:id/request-date-change', protect, authorizeRoles('doctor'), requestDateChange);

// @route   PUT /api/tasks/:id/review-date-change
// @desc    Admin reviews/approves/rejects a date change request
// @access  Private (Admin Only)
router.put('/:id/review-date-change', protect, authorizeRoles('admin'), reviewDateChange);

// NOTE: Original GET /api/tasks/:id route from before.
// It's generally better practice to move this logic to the controller,
// but for now, importing the model here fixes the current error.
router.get('/:id', protect, authorizeRoles('admin', 'doctor'), async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // Ensure only assigned doctor or admin can view the task
        if (req.user.role === 'doctor' && task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this task' });
        }
        res.status(200).json(task);
    } catch (error) {
        // Handle CastError for invalid ObjectId (e.g., if :id is not a valid MongoDB ID)
        if (error.name === 'CastError' && error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Task ID format' });
        }
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;