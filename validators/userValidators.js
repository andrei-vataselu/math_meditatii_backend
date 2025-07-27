const { body } = require('express-validator');

const popularProviders = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'aol.com', 'hotmail.com', 'ymail.com', 'mail.com'
];

const emailValidator = body('email')
  .isEmail().withMessage('Email invalid')
  .isLength({ min: 6, max: 50 }).withMessage('Emailul trebuie să aibă între 6 și 50 de caractere')
  .trim().normalizeEmail()
  .custom((value) => {
    const domain = value.split('@')[1];
    if (!domain || !popularProviders.includes(domain.toLowerCase())) {
      throw new Error('Emailul trebuie să fie de la un provider popular (gmail, yahoo, outlook, etc)');
    }
    return true;
  });

const passwordValidator = body('password')
  .isLength({ min: 8, max: 64 }).withMessage('Parola trebuie să aibă între 8 și 64 de caractere')
  .matches(/[0-9]/).withMessage('Parola trebuie să conțină cel puțin o cifră')
  .matches(/[A-Z]/).withMessage('Parola trebuie să conțină cel puțin o literă mare')
  .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Parola trebuie să conțină cel puțin un simbol')
  .trim();

const phoneValidator = body('phoneNumber')
  .matches(/^07[0-9]{8}$/)
  .withMessage('Numărul de telefon trebuie să fie românesc, 10 cifre și să înceapă cu 07');

const signupValidation = [
  emailValidator,
  passwordValidator,
  body('firstName').isString().trim().escape().isLength({ min: 1, max: 50 }).withMessage('Prenumele este obligatoriu și trebuie să aibă între 1 și 50 de caractere'),
  body('lastName').isString().trim().escape().isLength({ min: 1, max: 50 }).withMessage('Numele este obligatoriu și trebuie să aibă între 1 și 50 de caractere'),
  phoneValidator
];

const updateProfileValidation = [
  body('firstName').optional().isString().trim().escape().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().escape().isLength({ min: 1, max: 50 }),
  phoneValidator.optional()
];

const loginValidation = [
  emailValidator,
  passwordValidator
];

module.exports = { signupValidation, updateProfileValidation, loginValidation }; 