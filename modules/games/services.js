const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let cachedGames = null

const loadGames = () => {
  return new Promise((resolve, reject) => {

    if (cachedGames) {
      return resolve(cachedGames.slice(0, 5))
    }
    
    const results = [];

    fs.createReadStream(
      path.join(__dirname, "../../../research/data/processed/games_ui.csv"),
    )
      .pipe(csv())
      .on("data", (data) =>
        results.push({
          appid: data.appid,
          name: data.name,
          header_image: data.header_image,
          genres: data.genres,
          price: data.price,
        }),
      )
      .on("end", () => {
        cachedGames = results

        resolve(results.slice(0, 5))
      })
      .on("error", (err) => reject(err));
  });
};

module.exports = {
  loadGames,
};
