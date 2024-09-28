const express = require('express')
const router = express.Router()

router.get('/', function (req, res){
 res.render('Index', {title: 'Expense Tracker | Homepage', user: req.user})
})
router.get('/about', function (req, res){
 res.render('About', {title: 'Expense Tracker | About', user: req.user})
})

module.exports = router 