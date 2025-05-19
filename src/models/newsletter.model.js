import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, 
      minlength: 2, 
      maxlength: 100, 
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, 
      validate: {
        validator: function (v) {
          // Validate email format
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"], 
      default: "pending", 
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for performance
newsletterSchema.index({ email: 1 });

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;