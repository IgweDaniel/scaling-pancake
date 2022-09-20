class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.status = "error";
    this.statusCode = statusCode;
    this.message = message;
  }
}

const handleError = (err, _, res, next) => {
  const { statusCode, message } = err;
  // logg the errors
  if (!statusCode || statusCode === 500) {
    console.log(err);
  }
  res.status(statusCode || 500).json({
    status: "error",
    statusCode: statusCode || 500,
    message: statusCode === 500 ? "An error occurred" : message,
  });
  next();
};

export { ErrorHandler, handleError };
