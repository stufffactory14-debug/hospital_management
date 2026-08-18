const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

const roles = ['admin', 'doctor', 'receptionist'];
const fields = ['name', 'email', 'password', 'role', 'doctor', 'active'];

const sendValidation = (res, message) => res.status(400).json({ success: false, message });
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active !== false,
  doctor: user.doctor ? { id: user.doctor._id || user.doctor, name: user.doctor.name, specialization: user.doctor.specialization } : null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
const pickFields = (body) => Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));

const validateRoleAndDoctor = async ({ role, doctor, active = true, userId }) => {
  if (!roles.includes(role)) return { status: 400, message: 'Role must be admin, doctor, or receptionist' };
  if (typeof active !== 'boolean') return { status: 400, message: 'Active must be a boolean' };
  if (role !== 'doctor' && doctor) return { status: 400, message: 'Only doctor users may be linked to a Doctor profile' };
  if (role === 'doctor' && !doctor) return { status: 400, message: 'Doctor users must be linked to a Doctor profile' };
  if (!doctor) return null;
  if (!mongoose.isValidObjectId(doctor)) return { status: 400, message: 'Invalid doctor ID' };
  if (!await Doctor.exists({ _id: doctor })) return { status: 404, message: 'Doctor not found' };
  if (active !== false && await User.exists({ role: 'doctor', doctor, active: true, ...(userId ? { _id: { $ne: userId } } : {}) })) {
    return { status: 409, message: 'Doctor is already linked to an active user' };
  }
  return null;
};

const protectLastAdmin = async (user, nextRole, nextActive) => {
  if (user.role !== 'admin' || (nextRole === 'admin' && nextActive !== false)) return null;
  if (await User.countDocuments({ role: 'admin', active: true }) <= 1) return 'At least one active admin account must remain';
  return null;
};

const populateUser = (query) => query.populate('doctor', 'name specialization');

const getUsers = async (req, res) => {
  try {
    const users = await populateUser(User.find().sort({ createdAt: -1 }));
    return res.status(200).json({ success: true, data: users.map(serializeUser) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve users' });
  }
};

const getUserById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendValidation(res, 'Invalid user ID');
  try {
    const user = await populateUser(User.findById(req.params.id));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, data: serializeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve user' });
  }
};

const createUser = async (req, res) => {
  try {
    const payload = pickFields(req.body);
    const relationshipError = await validateRoleAndDoctor(payload);
    if (relationshipError) return res.status(relationshipError.status).json({ success: false, message: relationshipError.message });
    const user = await User.create(payload);
    await user.populate('doctor', 'name specialization');
    return res.status(201).json({ success: true, data: serializeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email or Doctor profile is already in use' });
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidation(res, error.message);
    return res.status(500).json({ success: false, message: 'Unable to create user' });
  }
};

const updateUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendValidation(res, 'Invalid user ID');
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const payload = pickFields(req.body);
    const nextRole = payload.role ?? user.role;
    const nextActive = payload.active ?? user.active;
    const nextDoctor = nextRole === 'doctor'
      ? (Object.hasOwn(payload, 'doctor') ? payload.doctor : user.doctor)
      : null;
    const adminError = await protectLastAdmin(user, nextRole, nextActive);
    if (adminError) return sendValidation(res, adminError);
    const relationshipError = await validateRoleAndDoctor({ role: nextRole, doctor: nextDoctor, active: nextActive, userId: user._id });
    if (relationshipError) return res.status(relationshipError.status).json({ success: false, message: relationshipError.message });
    Object.assign(user, payload);
    if (nextRole !== 'doctor') user.doctor = undefined;
    await user.save();
    await user.populate('doctor', 'name specialization');
    return res.status(200).json({ success: true, data: serializeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email or Doctor profile is already in use' });
    if (error.name === 'ValidationError' || error.name === 'CastError') return sendValidation(res, error.message);
    return res.status(500).json({ success: false, message: 'Unable to update user' });
  }
};

const deleteUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendValidation(res, 'Invalid user ID');
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const adminError = await protectLastAdmin(user, user.role, false);
    if (adminError) return sendValidation(res, adminError);
    user.active = false;
    await user.save();
    return res.status(200).json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to deactivate user' });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
