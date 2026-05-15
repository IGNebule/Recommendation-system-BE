const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let cachedGames = null;

const loadGames = () => {
  return new Promise((resolve, reject) => {
    if (cachedGames) {
      return resolve(cachedGames.slice(0, 15));
    }

    const results = [];

    fs.createReadStream(
      path.join(__dirname, "../../../research/data/processed/games_ui.csv"),
    )
      .pipe(csv())
      .on("data", (data) => {
        // Parse JSON fields from CSV (now properly serialized as JSON)
        const movies = safeJsonParse(data.movies, []);
        const screenshots = safeJsonParse(data.screenshots, []);

        // Extract first movie video URL (prefer webm max, fallback to 480)
        let movieVideo = null;
        if (movies.length > 0) {
          const first = movies[0];
          movieVideo =
            first.webm_max ||
            first.webm_480 ||
            first.mp4_max ||
            first.mp4_480 ||
            null;
        }

        results.push({
          appid: data.appid,
          name: data.name,
          release_date: data.release_date,
          developer: data.developer,
          publisher: data.publisher,
          categories: data.categories,
          positive_ratings: data.positive_ratings,
          negative_ratings: data.negative_ratings,
          average_playtime: data.average_playtime,
          median_playtime: data.median_playtime,
          short_description: data.short_description,
          background: data.background,
          screenshots, // parsed array of full URLs
          movies, // parsed array of movie objects
          movieVideo, // direct video URL for <video> tag
          header_image: data.header_image,
          genres: data.genres,
          price: data.price,
        });
      })
      .on("end", () => {
        cachedGames = results;
        resolve(results.slice(0, 15));
      })
      .on("error", (err) => reject(err));
  });
};

// Safe JSON parse with fallback
function safeJsonParse(str, fallback = null) {
  if (!str || str === "nan" || str === "None" || str === "[]") return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("JSON parse failed:", str.slice(0, 100));
    return fallback;
  }
}

module.exports = { loadGames };
