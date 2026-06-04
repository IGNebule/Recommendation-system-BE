const service = require("./services");

const getReviews = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;

    const result = await service.getReviews({
      page,
      limit,
    });

    return res.json(result);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch reviews",
    });
  }
};

const createReview = async (req, res) => {
  try {
    const { reviewTitle, message, rating } = req.body;

    if (!reviewTitle || !message || !rating) {
      return res.status(400).json({
        error: "Review title, message, and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
    }

    const review = await service.createReview({
      userEmail: req.user.email,
      reviewTitle,
      message,
      rating: numericRating,
    });

    return res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Failed to submit review",
    });
  }
};

module.exports = {
  getReviews,
  createReview,
};
