require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');


const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { loginLimiter, apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());


app.use(apiLimiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.post('/api/v1/auth/login', loginLimiter, authRoutes);

// Handle 404
app.use(notFoundHandler);

// Handle all other errors
app.use(errorHandler);

module.exports = app;
