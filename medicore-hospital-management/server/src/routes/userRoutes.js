const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();
router.use(protect, authorizeRoles('admin'));
router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
