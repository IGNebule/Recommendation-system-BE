const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const { toGameCard, toGameDetail } = require("./serializers");

let cachedGames = null;
let gamesMap = null;
let loadingPromise = null;
let cacheLoadedAt = null

const toHttps = (url) => {
  if (!url) return null;

  return String(url).replace(/^http:/, "https:");
};

const extractScreenshotUrl = (screenshot) => {
  if (!screenshot) return null;

  if (typeof screenshot === "string") {
    return toHttps(screenshot);
  }

  return toHttps(
    screenshot.path_full ||
      screenshot.path_thumbnail ||
      screenshot.full ||
      screenshot.thumbnail ||
      screenshot.url ||
      null,
  );
};

const extractScreenshotUrls = (screenshots = []) => {
  if (!Array.isArray(screenshots)) return [];

  return screenshots.map(extractScreenshotUrl).filter(Boolean);
};

const safeJsonParse = (str, fallback = null) => {
  if (!str || str === "nan" || str === "None" || str === "[]") {
    return fallback;
  }

  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("JSON parse failed:", String(str).slice(0, 100));
    return fallback;
  }
};

const normalizeText = (text = "") => {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractTerms = (text = "") => {
  const normalized = normalizeText(text);

  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
};

const unique = (items = []) => {
  return [...new Set(items)];
};

const sortGames = (games = [], sort = "trending") => {
  const sortedGames = [...games];

  if (sort === "top-rated") {
    return sortedGames.sort((a, b) => {
      const ratingDiff =
        toNumber(b.rating_percent) - toNumber(a.rating_percent);

      if (ratingDiff !== 0) return ratingDiff;

      return toNumber(b.total_reviews) - toNumber(a.total_reviews);
    });
  }

  if (sort === "most-played") {
    return sortedGames.sort((a, b) => {
      return toNumber(b.average_playtime) - toNumber(a.average_playtime);
    });
  }

  return sortedGames.sort((a, b) => {
    return toNumber(b.trending_score) - toNumber(a.trending_score);
  });
};

const buildBrowseText = ({ genres, categories, tags }) => {
  return normalizeText(`
    ${genres || ""}
    ${categories || ""}
    ${tags || ""}
  `);
};

const normalize = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

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

const filterByMinYear = (games = [], minYear) => {
  if (!minYear) return games;

  const year = Number(minYear);

  if (!Number.isFinite(year)) return games;

  return games.filter((game) => {
    const releaseYear = Number(game.release_year);

    return Number.isFinite(releaseYear) && releaseYear >= year;
  });
};

const filterGames = ({ games = [], minYear, genre, tag, category } = {}) => {
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

const parseGames = () => {
  if (cachedGames && gamesMap) {
    return Promise.resolve({
      games: cachedGames,
      map: gamesMap,
      cached: true,
      loadedAt: cacheLoadedAt,
    });
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    console.log("[CACHE] Loading games_ui.csv into memory...");

    const results = [];
    const map = new Map();

    fs.createReadStream(
      path.join(__dirname, "../../../research/data/processed/games_ui.csv"),
    )
      .pipe(csv())
      .on("data", (data) => {
        const movies = safeJsonParse(data.movies, []);
        const screenshots = safeJsonParse(data.screenshots, []);
        const screenshotUrls = extractScreenshotUrls(screenshots);
        const bannerScreenshot =
          screenshotUrls[0] || data.background || data.header_image || null;

        let movieVideo = null;

        if (movies.length > 0) {
          const first = movies[0];

          movieVideo =
            first.video ||
            first.webm_max ||
            first.webm_480 ||
            first.mp4_max ||
            first.mp4_480 ||
            null;
        }

        const platforms = data.platforms || "";
        const platformList = safeJsonParse(data.platforms_list, []);

        const genres = data.genres || "";
        const categories = data.categories || "";
        const tags = data.tags_text || "";

        const genreList = safeJsonParse(data.genres_list, []);
        const categoryList = safeJsonParse(data.categories_list, []);
        const tagList = safeJsonParse(data.tags_list, []);

        const browseTerms = unique([...genreList, ...categoryList, ...tagList]);

        const browseText = buildBrowseText({
          genres,
          categories,
          tags,
        });

        const gameObject = {
          appid: String(data.appid).trim(),
          name: data.name,
          search_name: data.search_name,

          release_date: data.release_date,
          release_year: data.release_year,

          developer: data.developer,
          publisher: data.publisher,

          platforms,
          platformList,

          genres,
          categories,
          tags,

          genreList,
          categoryList,
          tagList,

          browseText,
          browseTerms,

          positive_ratings: data.positive_ratings,
          negative_ratings: data.negative_ratings,
          total_reviews: data.total_reviews,
          rating_percent: data.rating_percent,

          average_playtime: data.average_playtime,
          median_playtime: data.median_playtime,

          price: data.price,
          short_description: data.short_description,

          background: data.background,
          screenshots,
          screenshotUrls,
          bannerScreenshot,
          movies,
          movieVideo,
          header_image: data.header_image,

          trending_score: data.trending_score,
        };

        results.push(gameObject);
        map.set(gameObject.appid, gameObject);
      })
      .on("end", () => {
        cachedGames = results;
        gamesMap = map;
        cacheLoadedAt = new Date().toISOString();
        loadingPromise = null;

        console.log(`[CACHE] Loaded ${results.length} games into memory.`);

        resolve({
          games: cachedGames,
          map: gamesMap,
          cached: false,
          loadedAt: cacheLoadedAt,
        });
      })
      .on("error", (err) => {
        loadingPromise = null;
        reject(err);
      });
  });

  return loadingPromise;
};

const warmGameCache = async () => {
  await parseGames();

  return {
    message: "Game cache warmed",
    total: cachedGames?.length || 0,
    loadedAt: cacheLoadedAt,
  };
};

const clearGameCache = () => {
  cachedGames = null;
  gamesMap = null;
  loadingPromise = null;
  cacheLoadedAt = null;

  return {
    message: "Game cache cleared",
  };
};

const getGameCacheStatus = () => {
  return {
    cached: Boolean(cachedGames && gamesMap),
    total: cachedGames?.length || 0,
    loadedAt: cacheLoadedAt,
  };
};

const loadGames = async ({
  page = 1,
  limit = 15,
  minYear,
  genre,
  tag,
  category,
  sort = "trending",
  minReviews = 0,
} = {}) => {
  const { games } = await parseGames();

  let filteredGames = filterGames({
    games,
    minYear,
    genre,
    tag,
    category,
  });

  if (sort === "top-rated") {
    filteredGames = filteredGames.filter((game) => {
      return toNumber(game.total_reviews) >= minReviews;
    });
  }

  if (sort === "most-played") {
    filteredGames = filteredGames.filter((game) => {
      return toNumber(game.average_playtime) > 0;
    });
  }

  if (sort === "trending") {
    filteredGames = filteredGames.filter((game) => {
      return toNumber(game.trending_score) > 0;
    });
  }

  const sortedGames = sortGames(filteredGames, sort).map((game) =>
    toGameCard(game),
  );

  return paginate(sortedGames, page, limit);
};

const getGameById = async (appid) => {
  const { map } = await parseGames();
  const game = map.get(String(appid).trim());

  if (!game) return null;

  return toGameDetail(game);
};

module.exports = {
  loadGames,
  getGameById,
  parseGames,
  warmGameCache,
  clearGameCache,
  getGameCacheStatus,
};
