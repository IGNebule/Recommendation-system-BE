const toGameCard = (game, extra = {}) => {
  return {
    appid: game.appid,
    name: game.name,
    search_name: game.search_name,

    release_date: game.release_date,
    release_year: game.release_year,

    developer: game.developer,
    publisher: game.publisher,

    genres: game.genres,
    categories: game.categories,
    tags: game.tags,

    genreList: game.genreList,
    categoryList: game.categoryList,
    tagList: game.tagList,

    positive_ratings: game.positive_ratings,
    negative_ratings: game.negative_ratings,
    total_reviews: game.total_reviews,
    rating_percent: game.rating_percent,

    average_playtime: game.average_playtime,
    median_playtime: game.median_playtime,

    price: game.price,

    header_image: game.header_image,
    background: game.background,

    movieVideo: game.movieVideo,

    // clean URL array for frontend
    screenshots: game.screenshotUrls || [],

    // single preferred screenshot for GameBanner
    bannerScreenshot: game.bannerScreenshot,

    short_description: game.short_description,

    trending_score: game.trending_score,

    trending_score: game.trending_score,

    ...extra,
  };
};

const toGameDetail = (game) => {
  return {
    ...game,
  };
};

module.exports = {
  toGameCard,
  toGameDetail,
};
