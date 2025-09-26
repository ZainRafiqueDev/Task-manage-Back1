export class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  if (err.name === "CastError") {
    error = new ErrorResponse("Resource not found", 404);
  }

  if (err.code === 11000) {
    error = new ErrorResponse("Duplicate field value entered", 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(message, 400);
  }

  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse("Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse("Token expired", 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
