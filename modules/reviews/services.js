const Review = require("../../models/review");
const User = require("../../models/user");

const getAuthorTitle = (preferencesCount = 0) => {
  if (preferencesCount >= 30) return "Library Curator";
  if (preferencesCount >= 10) return "Genre Explorer";
  if (preferencesCount >= 5) return "Game Scout";

  return "New Explorer";
};

const getDisplayName = (user) => {
  if (user.name) return user.name;
  if (user.username) return user.username;

  return user.email.split("@")[0];
};

const getReviews = async ({ page = 1, limit = 12 } = {}) => {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),

    Review.countDocuments(),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data: reviews,
  };
};

const createReview = async ({ userEmail, reviewTitle, message, rating }) => {
  const user = await User.findOne({
    email: userEmail,
  }).lean();

  if (!user) {
    throw new Error("User not found");
  }

  const preferencesCount = Array.isArray(user.preferences)
    ? user.preferences.length
    : 0;

  const review = await Review.create({
    userEmail,
    authorName: getDisplayName(user),
    authorAvatarUrl: user.avatarUrl || "",
    authorTitle: getAuthorTitle(preferencesCount),
    preferencesCount,
    reviewTitle,
    message,
    rating,
  });

  return review;
};

module.exports = {
  getReviews,
  createReview,
};
