const { parseGames } = require("../games/services");
const { toGameCard } = require("../games/serializers");

const toNumber = (value) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : 0;
};

const paginate = (items = [], page = 1, limit = 15) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    data: items.slice(startIndex, endIndex),
  };
};

const normalize = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const filterByMinYear = (games = [], minYear) => {
  if (!minYear) return games;

  const year = Number(minYear);

  if (!Number.isFinite(year)) return games;

  return games.filter((game) => {
    const releaseYear = Number(game.release_year);

    return Number.isFinite(releaseYear) && releaseYear >= year;
  });
};

const getGameTerms = (game) => {
  return [
    ...(Array.isArray(game.genreList) ? game.genreList : []),
    ...(Array.isArray(game.tagList) ? game.tagList : []),
    ...(Array.isArray(game.categoryList) ? game.categoryList : []),
    game.genres,
    game.tags,
    game.categories,
  ]
    .filter(Boolean)
    .map(normalize);
};

const matchesTerm = (game, term) => {
  if (!term) return true;

  const normalizedTerm = normalize(term);

  if (!normalizedTerm) return true;

  const terms = getGameTerms(game);

  return terms.some((item) => {
    return item === normalizedTerm || item.includes(normalizedTerm);
  });
};

const filterByDiscoverQuery = ({
  games = [],
  minYear,
  genre,
  tag,
  category,
} = {}) => {
  let result = Array.isArray(games) ? games : [];

  result = filterByMinYear(result, minYear);

  if (genre) {
    result = result.filter((game) => matchesTerm(game, genre));
  }

  if (tag) {
    result = result.filter((game) => matchesTerm(game, tag));
  }

  if (category) {
    const categoryTerms = String(category)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    result = result.filter((game) => {
      return categoryTerms.some((term) => matchesTerm(game, term));
    });
  }

  return result;
};

const getTrendingGames = async ({
  page = 1,
  limit = 15,
  minYear,
  genre,
  tag,
  category,
} = {}) => {
  const { games } = await parseGames();

  const filteredGames = filterByDiscoverQuery({
    games,
    minYear,
    genre,
    tag,
    category,
  });

  const sortedGames = filteredGames
    .filter((game) => toNumber(game.trending_score) > 0)
    .sort((a, b) => {
      return toNumber(b.trending_score) - toNumber(a.trending_score);
    })
    .map((game) => toGameCard(game));

  return paginate(sortedGames, page, limit);
};

const getTopRatedGames = async ({
  page = 1,
  limit = 15,
  minReviews = 100,
  minYear,
  genre,
  tag,
  category,
} = {}) => {
  const { games } = await parseGames();

  const filteredGames = filterByDiscoverQuery({
    games,
    minYear,
    genre,
    tag,
    category,
  });

  const sortedGames = filteredGames
    .filter((game) => {
      return toNumber(game.total_reviews) >= minReviews;
    })
    .sort((a, b) => {
      return toNumber(b.rating_percent) - toNumber(a.rating_percent);
    })
    .map((game) => toGameCard(game));

  return paginate(sortedGames, page, limit);
};

const getMostPlayedGames = async ({
  page = 1,
  limit = 15,
  minYear,
  genre,
  tag,
  category,
} = {}) => {
  const { games } = await parseGames();

  const filteredGames = filterByDiscoverQuery({
    games,
    minYear,
    genre,
    tag,
    category,
  });

  const sortedGames = filteredGames
    .filter((game) => toNumber(game.average_playtime) > 0)
    .sort((a, b) => {
      return toNumber(b.average_playtime) - toNumber(a.average_playtime);
    })
    .map((game) => toGameCard(game));

  return paginate(sortedGames, page, limit);
};

module.exports = {
  getTrendingGames,
  getTopRatedGames,
  getMostPlayedGames,
};
