const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const { toGameCard, toGameDetail } = require("./serializers");

let cachedGames = null;
let gamesMap = null;

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

const buildBrowseText = ({ genres, categories, tags }) => {
  return normalizeText(`
    ${genres || ""}
    ${categories || ""}
    ${tags || ""}
  `);
};

const parseGames = () => {
  return new Promise((resolve, reject) => {
    if (cachedGames && gamesMap) {
      return resolve({
        games: cachedGames,
        map: gamesMap,
      });
    }

    const results = [];
    const map = new Map();

    fs.createReadStream(
      path.join(__dirname, "../../../research/data/processed/games_ui.csv"),
    )
      .pipe(csv())
      .on("data", (data) => {
        const movies = safeJsonParse(data.movies, []);
        const screenshots = safeJsonParse(data.screenshots, []);

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

          // raw text fields
          genres,
          categories,
          tags,

          // extracted arrays
          genreList,
          categoryList,
          tagList,

          // combined searchable/browsable fields
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

        resolve({
          games: results,
          map,
        });
      })
      .on("error", reject);
  });
};

const loadGames = async ({ page = 1, limit = 15 }) => {
  const { games } = await parseGames();

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedGames = games
    .slice(startIndex, endIndex)
    .map((game) => toGameCard(game));

  return {
    page,
    limit,
    total: games.length,
    totalPages: Math.ceil(games.length / limit),
    data: paginatedGames,
  };
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
};
