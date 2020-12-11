var express = require("express");
var router = express.Router();
var studentHelpers = require("../helpers/student_helpers");
const messagebird = require("messagebird")("A49F65VCrXSqStaKSNLAzzdct");

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
  let name = await studentHelpers.getStudentName(req.session.student._id);
  res.render("student/student_home", {
    student: true,
    name,
    id: req.session.student._id,
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
  let name = await studentHelpers.getStudentName(req.session.student._id);
  let profile = await studentHelpers.getProfile(req.session.student._id);
  res.render("student/student_profile", { student: true, name, profile });
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
      let studentname = await studentHelpers.getStudentName(
        req.session.student._id
      );
      
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

router.post("/step3", (req, res) => {
  var id = req.body.id;
  var token = req.body.token;
  let name = req.body.name;
  
  messagebird.verify.verify(id, token, (err, response) => {
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
      res.render("student/student_home", { student: true, name });
    }
  });
});



router.get("/student_assignments",async(req,res)=>{
  let name = await studentHelpers.getStudentName(req.session.student._id);
  await studentHelpers.newAssignments(req.session.student._id).then((assignments)=>{
  res.render("student/stud_assignments", { student: true, name,assignments});
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
  let name = await studentHelpers.getStudentName(req.session.student._id);
  await studentHelpers.getNotes(req.session.student._id).then((notes)=>{
  res.render("student/stud_notes", { student: true, name,notes});
})
})

router.get("/student_todays_task",async(req,res)=>{
  let name = await studentHelpers.getStudentName(req.session.student._id);
  let note= await studentHelpers.getTodaysNote()
  let assignment= await studentHelpers.getTodaysAssignment()
  res.render("student/todays_task", { student: true, name,note,assignment});
})

module.exports = router;
