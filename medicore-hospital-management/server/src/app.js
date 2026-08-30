const express = require('express');
const helmet = require('helmet');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const patientRoutes = require('./routes/patientRoutes');
const { paymentRoutes, invoicePaymentRoutes } = require('./routes/paymentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const queueRoutes = require('./routes/queueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const { corsOptions, mutationLimiter } = require('./middleware/securityMiddleware');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(require('cors')(corsOptions));
app.use(express.json());
app.use(mutationLimiter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MediCore server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoices', invoicePaymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  return next();
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.statusCode) ? error.statusCode : Number.isInteger(error.status) ? error.status : 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  return res.status(safeStatus).json({
    success: false,
    message: safeStatus === 500 ? 'Internal server error' : (error.message || 'Request failed'),
  });
});

module.exports = app;
