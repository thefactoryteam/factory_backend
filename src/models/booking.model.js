// models/Booking.js
import mongoose from 'mongoose';
import validator from 'validator'

const bookingSchema = new mongoose.Schema({
  // Registration details
  registrationType: {
    type: String,
    required: [true, 'Registration type is required'],
    enum: {
      values: ['Individual', 'Company'],
      message: 'Registration type must be either Individual or Company'
    },
    index: true
  },

  // Individual fields (conditional)
  individual: {
    fullName: {
      type: String,
      required: function() {
        return this.registrationType === 'Individual';
      },
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
      validate: {
        validator: function(v) {
          if (this.registrationType !== 'Individual') return true;
          return /^[a-zA-Z\s'-]+$/.test(v);
        },
        message: 'Full name can only contain letters, spaces, hyphens, and apostrophes'
      }
    },
    occupationRole: {
      type: String,
      required: function() {
        return this.registrationType === 'Individual';
      },
      trim: true,
      minlength: [2, 'Occupation/Role must be at least 2 characters'],
      maxlength: [100, 'Occupation/Role cannot exceed 100 characters']
    }
  },

  // Company fields (conditional)
  company: {
    name: {
      type: String,
      required: function() {
        return this.registrationType === 'Company';
      },
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [200, 'Company name cannot exceed 200 characters']
    },
    numberOfPeople: {
      type: Number,
      required: function() {
        return this.registrationType === 'Company';
      },
      min: [1, 'Number of people must be at least 1'],
      max: [1000, 'Number of people cannot exceed 1000'],
      validate: {
        validator: Number.isInteger,
        message: 'Number of people must be a whole number'
      }
    },
    description: {
      type: String,
      required: function() {
        return this.registrationType === 'Company';
      },
      trim: true,
      minlength: [10, 'Company description must be at least 10 characters'],
      maxlength: [500, 'Company description cannot exceed 500 characters']
    }
  },

  // Common fields
  dateOfUsage: {
    type: Date,
    required: [true, 'Date of usage is required'],
    validate: {
      validator: function(v) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return v >= today;
      },
      message: 'Date of usage cannot be in the past'
    },
    index: true
  },

  intentOfUsage: {
    type: String,
    required: [true, 'Intent of usage is required'],
    trim: true,
    minlength: [10, 'Intent of usage must be at least 10 characters'],
    maxlength: [300, 'Intent of usage cannot exceed 300 characters']
  },

  facilitiesRequired: {
    type: String,
    required: [true, 'Facilities required is required'],
    trim: true,
    minlength: [10, 'Facilities required must be at least 10 characters'],
    maxlength: [400, 'Facilities required cannot exceed 400 characters']
  },

  workspaceDuration: {
    type: String,
    required: [true, 'Workspace duration is required'],
    trim: true,
    minlength: [5, 'Workspace duration must be at least 5 characters'],
    maxlength: [200, 'Workspace duration cannot exceed 200 characters']
  },

  // Contact information
  contact: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email address'
      },
      index: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          // Remove all spaces and check if it's a valid phone number
          const cleanPhone = v.replace(/\s/g, '');
          return validator.isMobilePhone(cleanPhone, 'any', { strictMode: false });
        },
        message: 'Please provide a valid phone number'
      }
    }
  },

  // Status tracking
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'cancelled'],
      message: 'Status must be pending, approved, rejected, or cancelled'
    },
    default: 'pending',
    index: true
  },

  // Admin notes (for internal use)
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },

  // Audit trail
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  submittedBy: {
    ipAddress: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isIP(v);
        },
        message: 'Invalid IP address'
      }
    },
    userAgent: String
  },

  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Assuming you have a User model for admin users
  },

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false,
  // Enable automatic index creation in development
  autoIndex: process.env.NODE_ENV !== 'production'
});

// Compound indexes for common queries
bookingSchema.index({ submittedAt: -1, status: 1 });
bookingSchema.index({ dateOfUsage: 1, status: 1 });
bookingSchema.index({ 'contact.email': 1, submittedAt: -1 });
bookingSchema.index({ registrationType: 1, status: 1 });

// Index for soft delete queries
bookingSchema.index({ isDeleted: 1, submittedAt: -1 });

// Virtual for getting the contact person name
bookingSchema.virtual('contactPersonName').get(function() {
  if (this.registrationType === 'Individual') {
    return this.individual?.fullName;
  }
  return this.company?.name;
});

// Virtual for search-friendly text
bookingSchema.virtual('searchText').get(function() {
  const fields = [
    this.individual?.fullName,
    this.individual?.occupationRole,
    this.company?.name,
    this.company?.description,
    this.contact?.email,
    this.intentOfUsage,
    this.facilitiesRequired
  ].filter(Boolean);
  
  return fields.join(' ').toLowerCase();
});

// Pre-save middleware for data cleanup and validation
bookingSchema.pre('save', function(next) {
  // Clean up conditional fields based on registration type
  if (this.registrationType === 'Individual') {
    this.company = undefined;
  } else if (this.registrationType === 'Company') {
    this.individual = undefined;
  }

  // Normalize phone number
  if (this.contact?.phone) {
    this.contact.phone = this.contact.phone.replace(/\s+/g, ' ').trim();
  }

  next();
});

// Static methods
bookingSchema.statics.findActive = function() {
  return this.find({ isDeleted: { $ne: true } });
};

bookingSchema.statics.findByStatus = function(status) {
  return this.find({ status, isDeleted: { $ne: true } });
};

bookingSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    dateOfUsage: {
      $gte: startDate,
      $lte: endDate
    },
    isDeleted: { $ne: true }
  });
};

// Instance methods
bookingSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

bookingSchema.methods.approve = function(approvedBy, notes) {
  this.status = 'approved';
  this.processedAt = new Date();
  this.processedBy = approvedBy;
  if (notes) this.adminNotes = notes;
  return this.save();
};

bookingSchema.methods.reject = function(rejectedBy, notes) {
  this.status = 'rejected';
  this.processedAt = new Date();
  this.processedBy = rejectedBy;
  if (notes) this.adminNotes = notes;
  return this.save();
};

// Export the model
const Booking = mongoose.model('Booking', bookingSchema);

export default Booking

// // ==========================================
// // controllers/bookingController.js
// // ==========================================

// const Booking = require('../models/Booking');
// const rateLimit = require('express-rate-limit');



// class BookingController {
//   // Create a new booking
//   static async createBooking(req, res) {
//     try {
//       // Get client information
//       const clientInfo = {
//         ipAddress: req.ip || req.connection.remoteAddress,
//         userAgent: req.get('User-Agent')
//       };

//       // Prepare booking data based on registration type
//       const bookingData = {
//         registrationType: req.body.registrationType,
//         dateOfUsage: new Date(req.body.dateOfUsage),
//         intentOfUsage: req.body.intentOfUsage,
//         facilitiesRequired: req.body.facilitiesRequired,
//         workspaceDuration: req.body.workspaceDuration,
//         contact: {
//           email: req.body.officialEmail,
//           phone: req.body.phoneNumber
//         },
//         submittedBy: clientInfo
//       };

//       // Add type-specific fields
//       if (req.body.registrationType === 'Individual') {
//         bookingData.individual = {
//           fullName: req.body.fullName,
//           occupationRole: req.body.occupationRole
//         };
//       } else if (req.body.registrationType === 'Company') {
//         bookingData.company = {
//           name: req.body.companyName,
//           numberOfPeople: parseInt(req.body.numberOfPeople),
//           description: req.body.companyDescription
//         };
//       }

//       // Check for duplicate submissions (same email within last 24 hours)
//       const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//       const existingBooking = await Booking.findOne({
//         'contact.email': bookingData.contact.email,
//         submittedAt: { $gte: twentyFourHoursAgo },
//         isDeleted: { $ne: true }
//       });

//       if (existingBooking) {
//         return res.status(409).json({
//           success: false,
//           message: 'A booking request with this email was already submitted in the last 24 hours',
//           code: 'DUPLICATE_SUBMISSION'
//         });
//       }

//       // Check availability for the requested date (optional business logic)
//       const sameDataBookings = await Booking.countDocuments({
//         dateOfUsage: bookingData.dateOfUsage,
//         status: { $in: ['pending', 'approved'] },
//         isDeleted: { $ne: true }
//       });

//       // Example: Limit to 10 bookings per day
//       const dailyLimit = 10;
//       if (sameDataBookings >= dailyLimit) {
//         return res.status(409).json({
//           success: false,
//           message: 'The selected date is fully booked. Please choose another date.',
//           code: 'DATE_FULLY_BOOKED'
//         });
//       }

//       // Create and save the booking
//       const booking = new Booking(bookingData);
//       await booking.save();

//       // Log the successful submission
//       console.log(`New booking submitted: ${booking._id} by ${booking.contact.email}`);

//       // Send response (exclude sensitive information)
//       const responseData = {
//         id: booking._id,
//         registrationType: booking.registrationType,
//         dateOfUsage: booking.dateOfUsage,
//         status: booking.status,
//         submittedAt: booking.submittedAt
//       };

//       res.status(201).json({
//         success: true,
//         message: 'Booking request submitted successfully',
//         data: responseData
//       });

//       // TODO: Send confirmation email asynchronously
//       // await sendConfirmationEmail(booking);

//     } catch (error) {
//       console.error('Booking creation error:', error);

//       // Handle validation errors
//       if (error.name === 'ValidationError') {
//         const validationErrors = Object.values(error.errors).map(err => ({
//           field: err.path,
//           message: err.message,
//           value: err.value
//         }));

//         return res.status(400).json({
//           success: false,
//           message: 'Validation failed',
//           errors: validationErrors
//         });
//       }

//       // Handle duplicate key errors
//       if (error.code === 11000) {
//         return res.status(409).json({
//           success: false,
//           message: 'A booking with this information already exists',
//           code: 'DUPLICATE_KEY'
//         });
//       }

//       // Generic error response
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error. Please try again later.',
//         code: 'INTERNAL_ERROR'
//       });
//     }
//   }

//   // Get all bookings (admin only)
//   static async getAllBookings(req, res) {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 per page
//       const skip = (page - 1) * limit;

//       // Build filter
//       const filter = { isDeleted: { $ne: true } };
      
//       if (req.query.status) {
//         filter.status = req.query.status;
//       }
      
//       if (req.query.registrationType) {
//         filter.registrationType = req.query.registrationType;
//       }

//       if (req.query.dateFrom || req.query.dateTo) {
//         filter.dateOfUsage = {};
//         if (req.query.dateFrom) {
//           filter.dateOfUsage.$gte = new Date(req.query.dateFrom);
//         }
//         if (req.query.dateTo) {
//           filter.dateOfUsage.$lte = new Date(req.query.dateTo);
//         }
//       }

//       // Execute query with pagination
//       const [bookings, total] = await Promise.all([
//         Booking.find(filter)
//           .sort({ submittedAt: -1 })
//           .skip(skip)
//           .limit(limit)
//           .select('-submittedBy -__v'),
//         Booking.countDocuments(filter)
//       ]);

//       res.json({
//         success: true,
//         data: {
//           bookings,
//           pagination: {
//             page,
//             limit,
//             total,
//             pages: Math.ceil(total / limit)
//           }
//         }
//       });

//     } catch (error) {
//       console.error('Get bookings error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve bookings'
//       });
//     }
//   }

//   // Get single booking
//   static async getBooking(req, res) {
//     try {
//       const booking = await Booking.findOne({
//         _id: req.params.id,
//         isDeleted: { $ne: true }
//       }).select('-submittedBy -__v');

//       if (!booking) {
//         return res.status(404).json({
//           success: false,
//           message: 'Booking not found'
//         });
//       }

//       res.json({
//         success: true,
//         data: booking
//       });

//     } catch (error) {
//       console.error('Get booking error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve booking'
//       });
//     }
//   }

//   // Update booking status (admin only)
//   static async updateBookingStatus(req, res) {
//     try {
//       const { status, adminNotes } = req.body;
//       const bookingId = req.params.id;
//       const adminId = req.user?.id; // Assuming you have auth middleware

//       const booking = await Booking.findOne({
//         _id: bookingId,
//         isDeleted: { $ne: true }
//       });

//       if (!booking) {
//         return res.status(404).json({
//           success: false,
//           message: 'Booking not found'
//         });
//       }

//       // Update booking based on status
//       if (status === 'approved') {
//         await booking.approve(adminId, adminNotes);
//       } else if (status === 'rejected') {
//         await booking.reject(adminId, adminNotes);
//       } else {
//         booking.status = status;
//         booking.processedAt = new Date();
//         booking.processedBy = adminId;
//         if (adminNotes) booking.adminNotes = adminNotes;
//         await booking.save();
//       }

//       res.json({
//         success: true,
//         message: `Booking ${status} successfully`,
//         data: {
//           id: booking._id,
//           status: booking.status,
//           processedAt: booking.processedAt
//         }
//       });

//       // TODO: Send status update email to user
//       // await sendStatusUpdateEmail(booking);

//     } catch (error) {
//       console.error('Update booking status error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to update booking status'
//       });
//     }
//   }

//   // Soft delete booking (admin only)
//   static async deleteBooking(req, res) {
//     try {
//       const bookingId = req.params.id;
//       const adminId = req.user?.id;

//       const booking = await Booking.findOne({
//         _id: bookingId,
//         isDeleted: { $ne: true }
//       });

//       if (!booking) {
//         return res.status(404).json({
//           success: false,
//           message: 'Booking not found'
//         });
//       }

//       await booking.softDelete(adminId);

//       res.json({
//         success: true,
//         message: 'Booking deleted successfully'
//       });

//     } catch (error) {
//       console.error('Delete booking error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to delete booking'
//       });
//     }
//   }

//   // Get booking statistics (admin only)
//   static async getBookingStats(req, res) {
//     try {
//       const stats = await Booking.aggregate([
//         {
//           $match: { isDeleted: { $ne: true } }
//         },
//         {
//           $group: {
//             _id: '$status',
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       const typeStats = await Booking.aggregate([
//         {
//           $match: { isDeleted: { $ne: true } }
//         },
//         {
//           $group: {
//             _id: '$registrationType',
//             count: { $sum: 1 }
//           }
//         }
//       ]);

//       // Get recent bookings count (last 7 days)
//       const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
//       const recentCount = await Booking.countDocuments({
//         submittedAt: { $gte: sevenDaysAgo },
//         isDeleted: { $ne: true }
//       });

//       res.json({
//         success: true,
//         data: {
//           statusStats: stats,
//           typeStats: typeStats,
//           recentBookings: recentCount,
//           totalBookings: await Booking.countDocuments({ isDeleted: { $ne: true } })
//         }
//       });

//     } catch (error) {
//       console.error('Get booking stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve booking statistics'
//       });
//     }
//   }
// }

// module.exports = { BookingController, bookingLimiter };

// // ==========================================
// // routes/bookings.js
// // ==========================================

// const express = require('express');
// const router = express.Router();
// const { BookingController, bookingLimiter } = require('../controllers/bookingController');
// const { bookingValidationRules, validate } = require('../validation/bookingValidation');
// // const auth = require('../middleware/auth'); // Your auth middleware
// // const adminAuth = require('../middleware/adminAuth'); // Your admin auth middleware

// // Public routes
// router.post('/', 
//   bookingLimiter,
//   bookingValidationRules(),
//   validate,
//   BookingController.createBooking
// );

// // Admin routes (uncomment when you have auth middleware)
// // router.get('/', auth, adminAuth, BookingController.getAllBookings);
// // router.get('/stats', auth, adminAuth, BookingController.getBookingStats);
// // router.get('/:id', auth, adminAuth, BookingController.getBooking);
// // router.patch('/:id/status', auth, adminAuth, BookingController.updateBookingStatus);
// // router.delete('/:id', auth, adminAuth, BookingController.deleteBooking);

// module.exports = router;

// // ==========================================
// // Example usage in app.js
// // ==========================================

// /*
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const bookingRoutes = require('./routes/bookings');

// const app = express();

// // Security middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// // Body parsing
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Trust proxy for accurate IP addresses
// app.set('trust proxy', 1);

// // Routes
// app.use('/api/bookings', bookingRoutes);

// // MongoDB connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Error handling middleware
// app.use((error, req, res, next) => {
//   console.error('Unhandled error:', error);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error'
//   });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
// */