const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');

// Improved sanitizer for req.body, req.params, and req.query
function selectiveSanitize(req, res, next) {
  ['body', 'params', 'query'].forEach((location) => {
    if (req[location]) {
      for (const key in req[location]) {
        if (typeof req[location][key] === 'string') {
          req[location][key] = sanitizeHtml(req[location][key]);
        }
      }
      mongoSanitize.sanitize(req[location]);
    }
  });
  next();
}

module.exports = [selectiveSanitize];
