const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    authorName: {
      type: String,
      required: true,
      trim: true,
    },

    authorAvatarUrl: {
      type: String,
      default: "",
    },

    authorTitle: {
      type: String,
      default: "New Explorer",
    },

    preferencesCount: {
      type: Number,
      default: 0,
    },

    reviewTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 700,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Review", reviewSchema);
