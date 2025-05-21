import { Router } from "express";
import newsletterRoute from './newsLetter.route.js'
import { contactFormLimiter, newsletterLimiter } from "../../middlewares/rateLimiter.js";
import { newsLetterValidation, validateContactForm } from "../../middlewares/inputValidation.js";
import { createNewsletter } from "../controllers/simple.newsletter.js";
import { addContact } from "../controllers/contact.controller.js";

const router =  Router()

router.use("/newsletter", newsletterLimiter, newsLetterValidation, newsletterRoute)
router.post("/simple-newsletter", newsletterLimiter, newsLetterValidation, createNewsletter)
router.post("/contact", contactFormLimiter, validateContactForm, addContact)

export default router