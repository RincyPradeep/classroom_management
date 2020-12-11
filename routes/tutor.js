var express = require('express');
var router = express.Router();
var tutorHelpers = require("../helpers/tutor_helpers");
var studentHelpers = require("../helpers/student_helpers");
const { Db } = require('mongodb');

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

router.get("/student_details/each_student/:id",async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  let profile = await studentHelpers.getProfile(req.params.id);
  await tutorHelpers.getSubmittedFiles(req.params.id).then((assignments)=>{
  res.render("tutor/each_student",{tutor:true,name,profile,assignments})
})
})

router.get('/attendance',verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  res.render("tutor/attendance",{tutor:true,name})
})

router.get("/assignments",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  await tutorHelpers.getAssignments().then((assignments)=>{
    res.render("tutor/assignments",{tutor:true,name,assignments})
  })
  
})







router.post("/assignments/add_assignment",async(req,res)=>{
  await tutorHelpers.addAssignment(req.body,(id)=>{
    let image = req.files.Image;
    image.mv("./public/assignment_images/" + id + ".pdf", (err, done) => {
      if (!err) {
        res.redirect("/tutor/assignments")
      } else {
        console.log(err);
      }
    });
  })
  
})


router.get("/showPDF/:id",(req,res)=>{
  // await tutorHelpers.getAssignmentFilename(req.params.id).then(assignment=>{
  //  let filename=assignment.filename
  //   console.log("!!!!!!!!!!!!!!!",filename)
  let id=req.params.id
  console.log("###########",id)
  res.render("tutor/showPDF",{id})
})

router.get("/stud_PDF/:id",(req,res)=>{
  let id=req.params.id
  res.render("student/stud_PDF",{id})
})

router.get("/assignments/delete_assignment/:id",async(req,res)=>{
  await tutorHelpers.deleteAssignment(req.params.id).then(()=>{
    console.log("DEleted")
    res.redirect('/tutor/assignments')

})
})




router.get("/notes",verifyLogin,async(req,res)=>{
  let name=await tutorHelpers.getTutorName(req.session.tutor._id)
  await tutorHelpers.getNotes().then((notes)=>{
  res.render("tutor/notes",{tutor:true,name,notes})
  })
})

router.post("/notes",async(req,res)=>{
  await tutorHelpers.addNotes(req.body,(id)=>{
        console.log(req.body)
    if(req.files.Image){
      let image = req.files.Image;
    image.mv("./public/note_images/" + id + ".pdf")
    }
    if(req.files.Video){
      let video=req.files.Video;
    video.mv("./public/videos/"+id+".mp4")
    }
    res.redirect("/tutor/notes")
    
  })
})

router.get("/show_notesPDF/:id",(req,res)=>{
  let id=req.params.id
  res.render("tutor/show_notesPDF",{id})
})

router.get("/show_notes_video/:id",(req,res)=>{
  let id=req.params.id
  res.render("tutor/show_notes_video",{id})
})

router.get("/show_notes_yvideo/:id",(req,res)=>{
  let id=req.params.id
  res.render("tutor/show_notes_yvideo",{id})
})

router.get("/notes/delete_note/:id",async(req,res)=>{
  await tutorHelpers.deleteNote(req.params.id).then(()=>{
    console.log("DEleted")
    res.redirect('/tutor/notes')

})
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
