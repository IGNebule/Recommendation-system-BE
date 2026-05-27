const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/trending', controller.getTrendingGames)
router.get('/top-rated', controller.getTopRatedGames)
router.get('/most-played', controller.getMostPlayedGames)

module.exports = router