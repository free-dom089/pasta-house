const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server error",
    ...(process.env.NODE_ENV === "development" && error.details ? { details: error.details } : {})
  });
};

module.exports = errorHandler;
