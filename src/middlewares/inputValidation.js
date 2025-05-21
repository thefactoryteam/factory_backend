import { body, validationResult } from "express-validator";
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