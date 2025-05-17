// import asyncHandler from "express-async-handler"
// import Newsletter from "../../models/newsletter.model.js"
// import AppError from "../../middlewares/errorHandler.js"
// import { MailtrapClient } from "mailtrap";
// import dotenv from "dotenv"
// dotenv.config()


// // Should only
// // 1. Receive requests
// // 2. Call appropriate services
// // 3. Return responses

// export const createNewsletter = asyncHandler(async (req, res, next) => {
//     const { name, email } = req.body
//     const alreadySubscribed = await Newsletter.findOne({ email })

//     if (alreadySubscribed) return next(new AppError("User already subscribed", 400));



//     const TOKEN = process.env.MAILTRAP_TOKEN;

//     const client = new MailtrapClient({
//         token: TOKEN,
//     });

//     const sender = {
//         email: "dev@oodoroland.com",
//         name: "Roland",
//     };
//     const recipients = [
//         {
//             email: email,
//         }
//     ];

//     const response = client
//         .send({
//             from: sender,
//             to: recipients,
//             subject: "You are awesome!",
//             text: "Congrats for sending test email with Mailtrap!",
//             category: "Integration Test",
//         })
//         .then(console.log, console.error);

//         res.send(response)
        
// })


import asyncHandler from "express-async-handler"
import newsletterService from "../../services/newsletter.service.js"
import logger from "../../config/logger.js"
import AppError from "../../middlewares/errorHandler.js"



/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/v1/newsletter
 * @access  Public
 */

export const subscribeToNewsletter = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body

    // collect metadata for analytics and security
    const metadata = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
    }

    try {
        // Business logic to service layer
        const subscription = await newsletterService.createSubscription(name, email, metadata)

        logger.info(`New newsletter subscription: ${email}`)

        return res.status(201).json({
            success: true,
            message: "Successfully subscribed to newsletter",
            data: {
                id: subscription._id,
                name,
                email
            }
        })
    } catch (error) {
        // specific business errors
        if (error.code === 'DUPLICATE_SUBSCRIPION'){
            return next(new AppError("This email is already subscribed to our newsletter", 400))
        }

        logger.error({err: error}, "Newsletter subscription failed")
        return next(new AppError("Failed to process newsletter subscription", 500))
    }
    
})