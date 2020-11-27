var express = require('express');
var router = express.Router();

/* GET Landing page. */
router.get('/', function(req, res, next) {
  res.render('landing-page');
});

router.get('/student_login',(req,res)=>{
  res.render("student/student_login")
})
module.exports = router;
