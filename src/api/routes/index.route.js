import { Router } from "express";
import newsletterRoute from './newsLetter.route.js'
import { newsletterLimiter } from "../../middlewares/rateLimiter.js";
import { newsLetterValidation } from "../../middlewares/inputValidation.js";
import { createNewsletter } from "../controllers/simple.newsletter.js";

const router =  Router()

router.use("/newsletter", newsletterLimiter, newsLetterValidation, newsletterRoute)
router.post("/simple-newsletter", newsletterLimiter, newsLetterValidation, createNewsletter)

export default router