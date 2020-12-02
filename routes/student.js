var express = require('express');
var router = express.Router();
var studentHelpers = require("../helpers/student_helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.studentLoggedIn) {
    next();
  } else {
    res.redirect("/student_login");
  }
};
/* GET Landing page. */
router.get('/',function(req, res, next) {
  res.render('landing-page');
});

router.get('/student_home',verifyLogin,async(req,res)=>{
  let name=await studentHelpers.getStudentName(req.session.student._id)
  res.render("student/student_home",{student:true,name})
})

router.get('/student_login',(req,res)=>{
  if (req.session.studentLoggedIn){
    res.redirect("/student_home")
  }else{
    res.render("student/student_login",{loginErr: req.session.studentLoginErr})
  req.session.studentLoginErr = false;
}
})

router.post('/student_login',(req,res)=>{
  studentHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.student = response.student;
      req.session.studentLoggedIn = true;
      res.redirect("/student_home");
    } else {
      req.session.studentLoginErr ="Invalid username or password";
      res.redirect("/student_login");
    }
  });
})

router.get("/student_logout",(req,res)=>{
  req.session.student = null;
  req.session.studentLoggedIn = false;
  res.redirect("/");
})

router.get('/student_profile',verifyLogin,async(req,res)=>{
  let name=await studentHelpers.getStudentName(req.session.student._id)
  let profile=await studentHelpers.getProfile(req.session.student._id)
  res.render("student/student_profile",{student:true,name,profile})
})

router.post('/student_profile',verifyLogin,(req,res)=>{
  if(req.files.Image){
    let image = req.files.Image;
    image.mv("./public/student_images/" + req.session.student._id + ".jpg", (err, done) => {
      if (!err) {
          res.redirect("/student_profile")
        
      } else {
        console.log(err);
      }
    });

  }
  
})
module.exports = router;
