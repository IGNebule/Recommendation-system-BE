const { parseGames } = require('../games/services')
const { toGameCard } = require('../games/serializers')

const toNumber = (value) => {
    const num = Number(value)

    return Number.isFinite(num) ? num : 0
}

const paginate = (items, page, limit) => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        data: items.slice(startIndex, endIndex)
    }
}

const getTrendingGames = async ({
    page = 1,
    limit = 15
}) => {
    const { games } = await parseGames()
    const sortedGames = [...games]
        .filter((game) => toNumber(game.trending_score) > 0)
        .sort((a, b) => {
            return toNumber(b.trending_score) - toNumber(a.trending_score)
        })
        .map((game) => toGameCard(game))
    
    return paginate(sortedGames, page, limit)
}

const getTopRatedGames = async ({
    page = 1,
    limit = 15,
    minReviews = 100,
}) => {
    const { games } = await parseGames()

    const sortedGames = [...games]
        .filter((game) => {
            return toNumber(game.total_reviews) >= minReviews
        })
        .sort((a, b) => {
            return toNumber(b.rating_percent) - toNumber(a.rating_percent)
        })
        .map((game) => toGameCard(game))
    
    return paginate(sortedGames, page, limit)
}

const getMostPlayedGames = async ({
    page = 1,
    limit = 15
}) => {
    const { games } = await parseGames()

    const sortedGames = [...games]
     .filter((game) => toNumber(game.average_playtime) > 0)
     .sort((a, b) => {
        return toNumber(b.average_playtime) - toNumber(a.average_playtime)
     })
     .map((game) => toGameCard(game))
    
    return paginate(sortedGames, page, limit)
}

module.exports = {
    getTrendingGames,
    getTopRatedGames,
    getMostPlayedGames
}