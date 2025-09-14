const { validationResult } = require('express-validator');

exports.parseValidationErrors = (req, res, next) => {
	const result = validationResult(req)

	const errors = result.array().map(error => {
		return {
			path: error.path,
			message: error.msg,
		}
	});

	if (errors.length !== 0) {
		return res.status(400).json({ errors: errors });
	}

	next();
}

exports.parseSequelizeErrors = (exception) => {
  // Ako je Sequelize validation greška
  if (Array.isArray(exception?.errors)) {
    return exception.errors.map(error => ({
      message: error.message,
      path: error.path || null,
    }));
  }

  // Ako je običan error (npr. throw new Error)
  if (exception?.message) {
    return [{ message: exception.message }];
  }

  // Fallback
  return [{ message: 'Unexpected error occurred' }];
};