import { body, validationResult } from "express-validator";
import { isAfter, startOfDay } from "date-fns";
import AppError from "./errorHandler.js";

const validate = (validations) => {
    return [
        ...validations,
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessage = errors.array().map(err => err.msg);
                return next(new AppError(errorMessage, 400))
            }
            next();
        }
    ];
};


export const newsLetterValidation = validate([
    body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email format.")
    .normalizeEmail(),
  ]);

// Validation middleware
export const validateContactForm = validate([
    body('firstname')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name is required')
      .escape(),
    
    body('lastname')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name is required')
      .escape(),
    
    body('company')
      .trim()
      .isLength({ max: 200 })
      .withMessage('Company name must be fewer than 200 characters')
      .optional({ nullable: true, checkFalsy: true })
      .escape(),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Email must be fewer than 254 characters'),
    
    body('message')
      .trim()
      .isLength({ min: 5, max: 3000 })
      .withMessage('Message must be between 5-3000 characters')
      .escape()
  ]);



export const bookingValidationRules = validate([
  // Registration type validation
  body('registrationType')
    .notEmpty()
    .withMessage('Registration type is required')
    .isIn(['Individual', 'Company'])
    .withMessage('Registration type must be either Individual or Company'),

  // Conditional individual validations
  body('fullName')
    .if(body('registrationType').equals('Individual'))
    .notEmpty()
    .withMessage('Full name is required for individual registration')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes')
    .trim(),

  body('occupationRole')
    .if(body('registrationType').equals('Individual'))
    .notEmpty()
    .withMessage('Occupation/Role is required for individual registration')
    .isLength({ min: 2, max: 100 })
    .withMessage('Occupation/Role must be between 2 and 100 characters')
    .trim(),

  // Conditional company validations
  body('companyName')
    .if(body('registrationType').equals('Company'))
    .notEmpty()
    .withMessage('Company name is required for company registration')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters')
    .trim(),

  body('numberOfPeople')
    .if(body('registrationType').equals('Company'))
    .notEmpty()
    .withMessage('Number of people is required for company registration')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Number of people must be between 1 and 1000'),

  body('companyDescription')
    .if(body('registrationType').equals('Company'))
    .notEmpty()
    .withMessage('Company description is required for company registration')
    .isLength({ min: 10, max: 500 })
    .withMessage('Company description must be between 10 and 500 characters')
    .trim(),

  // Common field validations
  body('dateOfUsage')
    .notEmpty()
    .withMessage('Date of usage is required')
    .isISO8601()
    .withMessage('Date of usage must be a valid date')
    .custom((value) => {
      const inputDate = new Date(value);
      const today = startOfDay(new Date());
      
      if (!isAfter(inputDate, today) && inputDate.getTime() !== today.getTime()) {
        throw new Error('Date of usage cannot be in the past');
      }
      
      return true;
    }),

  body('intentOfUsage')
    .notEmpty()
    .withMessage('Intent of usage is required')
    .isLength({ min: 10, max: 300 })
    .withMessage('Intent of usage must be between 10 and 300 characters')
    .trim(),

  body('facilitiesRequired')
    .notEmpty()
    .withMessage('Facilities required is required')
    .isLength({ min: 10, max: 400 })
    .withMessage('Facilities required must be between 10 and 400 characters')
    .trim(),

  body('workspaceDuration')
    .notEmpty()
    .withMessage('Workspace duration is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Workspace duration must be between 5 and 200 characters')
    .trim(),

  body('officialEmail')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),

  body('phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('any', { strictMode: false })
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
]) 