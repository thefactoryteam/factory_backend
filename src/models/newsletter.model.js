// import mongoose from "mongoose";

// const newsletterSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true, 
//       minlength: 2, 
//       maxlength: 100, 
//     },
//     email: {
//       type: String,
//       required: true,
//       trim: true,
//       lowercase: true, 
//       validate: {
//         validator: function (v) {
//           // Validate email format
//           return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
//         },
//         message: (props) => `${props.value} is not a valid email address!`,
//       },
//     },
//     subscribedAt: {
//       type: Date,
//       default: Date.now,
//     },
//     emailStatus: {
//       type: String,
//       enum: ["pending", "sent", "failed"], 
//       default: "pending", 
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Indexing for performance
// newsletterSchema.index({ email: 1 });

// const Newsletter = mongoose.model("Newsletter", newsletterSchema);

// export default Newsletter;




// models/newsletter.model.js
import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'failed', 'pending_retry'],
      default: 'pending'
    },
    lastErrorMessage: {
      type: String
    },
    subscriptionDate: {
      type: Date,
      default: Date.now
    },
    emailSentAt: {
      type: Date
    },
    lastAttemptAt: {
      type: Date
    },
    unsubscribedAt: {
      type: Date
    },
    unsubscribeReason: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    subscriptionSource: {
      type: String,
      default: 'website'
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
// newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ emailStatus: 1 });
newsletterSchema.index({ active: 1 });
newsletterSchema.index({ subscriptionDate: 1 });

// Method to format subscriber for API responses
newsletterSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    subscriptionDate: this.subscriptionDate,
    status: this.active ? 'active' : 'inactive'
  };
};

// Static method to find subscribers that need email retry
newsletterSchema.statics.findFailedEmails = function() {
  return this.find({ 
    emailStatus: 'failed',
    active: true 
  }).sort({ lastAttemptAt: 1 });
};

// Virtual for subscription age in days
newsletterSchema.virtual('subscriptionAgeDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.subscriptionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

export default Newsletter;