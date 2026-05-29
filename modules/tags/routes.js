const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/', controller.getTags)
router.get('/:tag', controller.getGamesByTag)

module.exports = router