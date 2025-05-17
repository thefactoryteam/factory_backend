import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Removes extra spaces
      minlength: 2, // Ensures a valid name length
      maxlength: 100, // Prevents excessively long names
    },
    email: {
      type: String,
      required: true,
      // unique: true, 
      trim: true,
      lowercase: true, // Standardizes email format
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
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

// Indexing for performance
newsletterSchema.index({ email: 1 });

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;