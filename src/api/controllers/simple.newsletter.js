import asyncHandler from 'express-async-handler'
import { simpleNewsletterService } from '../../services/simple.newsletter.service.js';

/**
 * @desc    Subscribe to newsletter
 * @route   Post /api/v1/simple-newsletter
 * @access  Public
 */

export const createNewsletter = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body

    console.log(req.body);
    
    
    // Call the service layer to handle the subscription
  const newSubscriber = await simpleNewsletterService({ name, email });

  return res.status(201).json({
    success: true,
    message: "Thank you for subscribing!",
    data: {
      id: newSubscriber._id,
      name: newSubscriber.name,
      email: newSubscriber.email,
    },
  });
}) 