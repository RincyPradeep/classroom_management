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
router.get('/', function(req, res, next) {
  res.render('landing-page');
});

/* GET HOME PAGE */
router.get("/tutor_home",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/tutor_home",{tutor:true,name})
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

router.get("/tutor_profile",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  tutorHelpers.getProfile(req.session.tutor._id).then((profile)=>{
  res.render("tutor/tutor_profile",{tutor:true,profile,name})
  })
})

router.get("/tutor_profile/edit_profile",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  tutorHelpers.getProfile(req.session.tutor._id).then((profile)=>{
    res.render("tutor/edit_profile",{tutor:true,profile,name})
  })
})

router.post("/tutor_profile/edit_profile",async(req,res)=>{
  await tutorHelpers.changeProfile(req.body,req.session.tutor._id).then(()=>{
    res.redirect("/tutor/tutor_profile")
    if(req.files.Image){
      let image=req.files.Image
      image.mv("./public/images/"+req.session.tutor._id+".jpg")
    }
  })
})

router.get('/student_details',verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  await tutorHelpers.getAllStudents().then((students)=>{

    res.render("tutor/student_details",{tutor:true,name,students})
  })
  
})

router.get('/student_details/add_student',verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/add_student",{tutor:true,name})
})

router.post('/student_details/add_student',async(req,res)=>{
  await tutorHelpers.addStudent(req.body).then(()=>{
    res.redirect("/tutor/student_details/add_student")
  })

})

router.get('/student_details/edit_student/:id',verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  let student=await tutorHelpers.getStudentDetails(req.params.id)
  res.render("tutor/edit_student",{tutor:true,name,student})
})

router.post('/student_details/edit_student/:id',verifyLogin,async(req,res)=>{
  await tutorHelpers.updateStudent(req.body,req.params.id).then(()=>{
    res.redirect('/tutor/student_details')
  })
})

router.get('/student_details/delete_student/:id',verifyLogin,async(req,res)=>{
    await tutorHelpers.deleteStudent(req.params.id).then(()=>{
    console.log("DEleted")
    res.redirect('/tutor/student_details')
  })
})

router.get('/attendance',verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/attendance",{tutor:true,name})
})

router.get("/assignments",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/assignments",{tutor:true,name})
})

router.get("/edit_assignment",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/edit_assignments",{tutor:true,name})
})

router.get("/notes",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/notes",{tutor:true,name})
})

router.get("/edit_notes",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/edit_notes",{tutor:true,name})
})


router.get("/announcements",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/announcements",{tutor:true,name})
})

router.get("/events",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/events",{tutor:true,name})
})

router.get("/add_photos",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/add_photos",{tutor:true,name})
})


module.exports = router;
