const logger = require('../utils/logger');
const { ValidationError } = require('express-validation');
const { UnauthorizedError } = require('express-jwt');
const ApiError = require('../utils/ApiError');

/**
 * Convert error object to standardized API error format
 */
const normalizeError = (err) => {
  if (err instanceof ValidationError) {
    // Handle express-validation errors
    return {
      statusCode: err.statusCode,
      message: 'Validation Error',
      errors: err.details,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
  }

  if (err instanceof UnauthorizedError) {
    // Handle JWT authentication errors
    return {
      statusCode: err.status,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
  }

  if (err instanceof ApiError) {
    // Handle custom API errors
    return {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };
  }

  // Handle unexpected errors
  return {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
};

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Normalize the error
  const error = normalizeError(err);

  // Log the error
  logger.error(
    `${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Stack: ${err.stack}`
  );

  // Include error details in response if in development mode
  const response = {
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  // Set response status code
  res.status(error.statusCode);

  // Format response based on Accept header
  if (req.accepts('json')) {
    res.json(response);
  } else if (req.accepts('html')) {
    res.render('error', {
      title: `${error.statusCode} Error`,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } else {
    res.type('txt').send(response.message);
  }
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler
};