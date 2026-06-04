const express = require('express')
const router = express.Router()
const controller = require('./controller')

router.get('/', controller.getPreferences)
router.post('/:appid', controller.addPreference)
router.delete('/:appid', controller.removePreference)
router.patch('/:appid/weight', controller.updatePreferenceWeight)

module.exports = router