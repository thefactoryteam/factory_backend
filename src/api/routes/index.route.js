import { Router } from "express";
import newsletterRoute from './newsLetter.route.js'
import bookingRoute from './booking.route.js'
import { contactFormLimiter, newsletterLimiter } from "../../middlewares/rateLimiter.js";
import { bookingValidationRules, newsLetterValidation, validateContactForm } from "../../middlewares/inputValidation.js";
import { createNewsletter } from "../controllers/simple.newsletter.js";
import { addContact } from "../controllers/contact.controller.js";

const router =  Router()

router.use("/newsletter", newsletterLimiter, newsLetterValidation, newsletterRoute)
router.use("/book-now", bookingValidationRules, bookingRoute)
router.post("/simple-newsletter", newsletterLimiter, newsLetterValidation, createNewsletter)
router.post("/contact", contactFormLimiter, validateContactForm, addContact)

export default router