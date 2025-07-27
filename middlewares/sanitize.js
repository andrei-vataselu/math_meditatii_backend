const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');

// Custom sanitizer for req.body and req.params only
function selectiveSanitize(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeHtml(req.params[key]);
      }
    }
    mongoSanitize.sanitize(req.params);
  }
  next();
}

module.exports = [selectiveSanitize];
