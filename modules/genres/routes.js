const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/', controller.getTopics)
router.get('/:genre', controller.getGamesByTopic)

module.exports = router