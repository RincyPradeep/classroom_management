var express = require('express');
var router = express.Router();
var tutorHelpers = require("../helpers/tutor_helpers");


const verifyLogin = (req, res, next) => {
  if (req.session.tutorLoggedIn) {
    next();
  } else {
    res.redirect("/tutor/tutor_login");
  }
};

/* GET Landing Page */
router.get('/',verifyLogin, function(req, res, next) {
  res.render('landing-page');
});

/* GET HOME PAGE */
router.get("/tutor_home",verifyLogin,(req,res)=>{
  res.render("tutor/tutor_home",{tutor:true})
})

router.get('/tutor_login',(req,res)=>{
  if (req.session.tutorLoggedIn){
    res.redirect("/tutor/tutor_home")
  }else{
    res.render("tutor/tutor_login",{loginErr: req.session.tutorLoginErr})
  req.session.tutorLoginErr = false;
}
})

router.post('/tutor_login',(req,res)=>{
  tutorHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.tutor = response.tutor;
      req.session.tutorLoggedIn = true;
      res.redirect("/tutor/tutor_home");
    } else {
      req.session.tutorLoginErr ="Invalid username or password";
      res.redirect("/tutor/tutor_login");
    }
  });
})

router.get("/tutor_logout",(req,res)=>{
  req.session.tutor = null;
  req.session.tutorLoggedIn = false;
  res.redirect("/");
})

router.get("/tutor_profile",verifyLogin,(req,res)=>{
  
  res.render("tutor/tutor_profile",{tutor:true})
})

router.get("/edit_profile",verifyLogin,(req,res)=>{
  
  res.render("tutor/edit_profile",{tutor:true})
})

router.get('/student_details',verifyLogin,(req,res)=>{
  res.render("tutor/student_details",{tutor:true})
})

router.get('/add_student',verifyLogin,(req,res)=>{
  res.render("tutor/add_student",{tutor:true})
})

router.get('/edit_student',verifyLogin,(req,res)=>{
  res.render("tutor/edit_student",{tutor:true})
})

router.get('/attendance',verifyLogin,(req,res)=>{
  res.render("tutor/attendance",{tutor:true})
})

router.get("/assignments",verifyLogin,(req,res)=>{
  res.render("tutor/assignments",{tutor:true})
})

router.get("/edit_assignment",verifyLogin,(req,res)=>{
  res.render("tutor/edit_assignments",{tutor:true})
})

router.get("/notes",verifyLogin,(req,res)=>{
  res.render("tutor/notes",{tutor:true})
})

router.get("/edit_notes",verifyLogin,(req,res)=>{
  res.render("tutor/edit_notes",{tutor:true})
})


router.get("/announcements",verifyLogin,(req,res)=>{
  res.render("tutor/announcements",{tutor:true})
})

router.get("/events",verifyLogin,(req,res)=>{
  res.render("tutor/events",{tutor:true})
})

router.get("/add_photos",verifyLogin,(req,res)=>{
  res.render("tutor/add_photos",{tutor:true})
})
module.exports = router;
