var express = require("express");
var router = express.Router();
var studentHelpers = require("../helpers/student_helpers");
var tutorHelpers = require("../helpers/tutor_helpers");
const messagebird = require("messagebird")("L4cnY2R2jht4tkypehqF2M8qm");

const verifyLogin = (req, res, next) => {
  if (req.session.studentLoggedIn) {
    next();
  } else {
    res.redirect("/student_login");
  }
};
/* GET Landing page. */
router.get("/", function (req, res, next) {
  res.render("landing-page");
});

router.get("/student_home", verifyLogin, async (req, res) => {
  let event=await tutorHelpers.getEvent()
  let announcement=await tutorHelpers.getAnnouncement()
  res.render("student/student_home", {
    student: req.session.student,
    id: req.session.student._id,
    announcement,event
  });
});

router.get("/student_login", (req, res) => {
  if (req.session.studentLoggedIn) {
    res.redirect("/student_home");
  } else {
    res.render("student/student_login", {
      loginErr: req.session.studentLoginErr,
    });
    req.session.studentLoginErr = false;
  }
});

router.post("/student_login", (req, res) => {
  studentHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.student = response.student;
      req.session.studentLoggedIn = true;
      res.redirect("/student_home");
    } else {
      req.session.studentLoginErr = "Invalid username or password";
      res.redirect("/student_login");
    }
  });
});

router.get("/student_logout", (req, res) => {
  req.session.student = null;
  req.session.studentLoggedIn = false;
  res.redirect("/");
});

router.get("/student_profile", verifyLogin, async (req, res) => {
  // let name = await studentHelpers.getStudentName(req.session.student._id);
  let profile = await studentHelpers.getProfile(req.session.student._id);
  res.render("student/student_profile", { student:req.session.student , profile });
});

router.post("/student_profile", verifyLogin, (req, res) => {
  if (req.files.Image) {
    let image = req.files.Image;
    image.mv(
      "./public/student_images/" + req.session.student._id + ".jpg",
      (err, done) => {
        if (!err) {
          res.redirect("/student_profile");
        } else {
          console.log(err);
        }
      }
    );
  }
});

router.get("/otplogin", (req, res) => {
  res.render("student/otplogin");
});

router.post("/step2", async (req, res) => {
  let number = req.body.number;
  numberErr = false;
  await studentHelpers.verifyNumber(number).then(async (student) => {
    console.log(student);
    if (student) {
      req.session.student = student;
      // // req.session.studentLoggedIn = true;
      // let studentname = await studentHelpers.getStudentName(
      //   req.session.student._id
      // );
      let studentname=req.session.student.name
      messagebird.verify.create(
        number,
        {
          template: "Your verification code is %token",
        },
        function (err, response) {
          if (err) {
            console.log(err);
            res.render("student/otplogin", {
              error: err.errors[0].description,
            });
          } else {
            console.log(response);
            res.render("student/step2", {
              id: response.id,
              studentname,
            });
          }
        }
      );
    } else {
      console.log(response);
      res.render("student/otplogin", {
        id: response.id,
        numberErr: true,
      });
    }
  });
});

router.post("/step3",(req, res) => {
  var id = req.body.id;
  var token = req.body.token;
  let name = req.body.name;
  
  messagebird.verify.verify(id, token, async(err, response) => {
    if (err) {
      res.render("student/step2", {
        error: err.errors[0].description,
        id: id,
      });
    } else if (!token) {
      res.render("student/step2", {
        tokenErr: true,
        id: id,
      });
    } else {
      // req.session.student = student;
      req.session.studentLoggedIn = true;
      let announcement=await tutorHelpers.getAnnouncement()
      res.render("student/student_home", { student:req.session.student ,announcement});
    }
  });
});



router.get("/student_assignments",async(req,res)=>{
  // let name = await studentHelpers.getStudentName(req.session.student._id);
  await studentHelpers.newAssignments(req.session.student._id).then((assignments)=>{
  res.render("student/stud_assignments", { student:req.session.student ,assignments});
})
})

router.get("/showPDF/:id",(req,res)=>{
  let id=req.params.id
  res.render("tutor/showPDF",{id})
})

router.get("/assignments/submit_assignment/:id",async(req,res)=>{
  await studentHelpers.getTopicName(req.params.id).then((response)=>{
    let topic=response.topic
    let assignmentId=response.assignmentId
    res.json({topic,assignmentId})
  })
})

router.post("/assignments/submit_assignment",async(req,res)=>{
  console.log("******************",req.body)
 await studentHelpers.submitAssignment(req.body,req.session.student._id).then((id)=>{
  let image = req.files.Image;
  
  image.mv("./public/sub_assignment_images/" + id + ".pdf", (err, done) => {
    if (!err) {
      console.log("Moved to folder -------------------")
      res.redirect("/student_assignments")
    } else {
      console.log(err);
    }
  });
 })
})

router.get("/student_notes",async(req,res)=>{
  await studentHelpers.getNotes(req.session.student._id).then((notes)=>{
  res.render("student/stud_notes", { student:req.session.student,notes});
})
})

router.get("/student_todays_task",async(req,res)=>{
  let note= await studentHelpers.getTodaysNote()
  let assignment= await studentHelpers.getTodaysAssignment()
  res.render("student/todays_task", { student: req.session.student,note,assignment});
})

router.get("/student_announcements",async(req,res)=>{
  let announcement=await tutorHelpers.getAnnouncement()
  res.render("student/stud_announcement",{student:req.session.student,announcement})
})

router.get("/each_announcement/:id",async(req,res)=>{
  let announcement=await tutorHelpers.getEachAnnouncement(req.params.id)
  res.render("student/each_announcement",{student:req.session.student,announcement})
})

router.get("/student_events",async(req,res)=>{
  let event=await tutorHelpers.getEvent()
  res.render("student/stud_events",{student:req.session.student,event})
})

router.get("/each_event/:id",async(req,res)=>{
  let event=await tutorHelpers.getEachEvent(req.params.id)
  let alreadyPaid = await studentHelpers.checkAlreadyPaid(req.session.student._id,req.params.id)
  
   console.log("&&&&&&**********",alreadyPaid)
  if(event.method==="paid"){
    if(alreadyPaid==='true'){
      res.render("student/each_event",{student:req.session.student,event,alreadyPaid:true,joinbtn:false})
    }else{
      res.render("student/each_event",{student:req.session.student,event,joinbtn:true,alreadyPaid:false})
    }
  }else{
    res.render("student/each_event",{student:req.session.student,event,alreadyPaid:false,joinbtn:false})
  }
})

router.post("/event_payment",async(req,res)=>{
  
   studentHelpers.addPaymentDetails(req.body.studentId,req.body.eventId,req.body.amount).then((orderId)=>{
  studentHelpers.generateRazorpay(orderId,req.body.amount).then((response)=>{
    res.json(response)
  })
  })
})

router.post("/verify-payment",(req,res)=>{
  console.log(req.body)
  studentHelpers.verifyPayment(req.body).then(()=>{
    studentHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: "" });
  });
})
  

router.get("/student_attendance",async(req,res)=>{
  res.render("student/stud_attendance",{student:req.session.student})
})

router.get("/show_notes_video/:id",async(req,res)=>{
  let videoId=req.params.id
  let studentId=req.session.student._id
  await studentHelpers.markAttendance(studentId,videoId)
  res.render("tutor/show_notes_video",{videoId})
})

router.post("/mark_attendance", (req, res, next) => {
  console.log(req.body)
  studentHelpers.markAttendance(req.body).then((response) => {
    res.redirect("/student_home")
  });
});

module.exports = router;
