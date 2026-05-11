// modules/recommend/routes.js
const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/', controller.getPersonalized)
router.get('/game', controller.getRecommend)
router.post('/preferences', controller.savePreference)
router.delete('/preferences', controller.removePreference)

module.exports = router