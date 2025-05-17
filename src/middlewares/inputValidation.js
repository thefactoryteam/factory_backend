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