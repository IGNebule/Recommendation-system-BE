const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const getGames = async () => {
    return new Promise((resolve, reject) => {
        const results = []

        fs.createReadStream(
          path.join(__dirname, "../../../data/raw/steam.csv"),
        )
            .pipe(csv())
            .on("data", (data) => {
                results.push({
                    appid: data.appid,
                    name: data.name,
                    genres: data.genres,
                    price: data.price,
                })
            })
            .on("end", () => {
                resolve(results.slice(0, 100))
            })
            .on("error", reject)
    })
}

module.exports = {
    getGames
}