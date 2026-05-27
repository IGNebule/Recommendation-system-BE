const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/', controller.getPreferences)
router.post('/:appid', controller.savePreference)
router.delete('/:appid', controller.removePreference)

module.exports = router