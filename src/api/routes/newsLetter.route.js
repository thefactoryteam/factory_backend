// api/routes/newsletter.routes.js
import { Router } from "express";
import { 
  subscribeToNewsletter,
//   verifySubscription,
//   unsubscribeFromNewsletter,
//   getSubscribers,
//   deleteSubscriber,
//   exportSubscribers,
//   checkEmailQueueHealth
} from "../controllers/newsletter.controller.js";
// import { validateSubscribe } from "../validators/newsletter.validator.js";
// import { authMiddleware, adminMiddleware } from "../../middlewares/auth.js";
// import { rateLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

/**
 * Public routes
 */
router.post(
  "/", 
//   rateLimiter('subscribe'), // Rate limit subscription requests
//   validateSubscribe,        // Validate request body
  subscribeToNewsletter
);

// router.get(
//   "/verify", 
//   verifySubscription
// );

// router.post(
//   "/unsubscribe", 
//   unsubscribeFromNewsletter
// );

/**
 * Admin routes - protected by authentication and admin role
 * All admin routes require authentication and admin privileges
 */
// router.use('/admin', authMiddleware, adminMiddleware);

// router.get(
//   "/admin/subscribers", 
//   getSubscribers
// );

// router.delete(
//   "/admin/subscribers/:id", 
//   deleteSubscriber
// );

// router.get(
//   "/admin/export", 
//   exportSubscribers
// );

/**
 * Health check route - protected for internal use only
 */
// router.get(
//   "/health/email-queue", 
//   authMiddleware, 
//   adminMiddleware, 
//   checkEmailQueueHealth
// );

export default router;