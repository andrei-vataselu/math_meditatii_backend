const { validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    // Format clar pentru frontend: [{ field, message }]
    const formatted = errors.array().map(err => ({ field: err.param, message: err.msg }));
    res.status(400).json({ errors: formatted });
  };
};

module.exports = validate; 