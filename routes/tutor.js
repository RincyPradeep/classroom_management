var express = require("express");
var router = express.Router();
var tutorHelpers = require("../helpers/tutor_helpers");
var studentHelpers = require("../helpers/student_helpers");
const { Db } = require("mongodb");
const base64Img = require("base64-img");

const verifyLogin = (req, res, next) => {
  if (req.session.tutorLoggedIn) {
    next();
  } else {
    res.redirect("/tutor/tutor_login");
  }
};

/* GET Landing Page */
router.get("/", function (req, res, next) {
  res.render("landing-page");
});

/* GET HOME PAGE */
router.get("/tutor_home", verifyLogin, async (req, res) => {
  let announcement = await tutorHelpers.getAnnouncement();
  let event = await tutorHelpers.getEvent();
  res.render("tutor/tutor_home", {
    tutor: req.session.tutor,
    announcement,
    event,
  });
});

//-------------------LOGIN--------------------------------

router.get("/tutor_login", (req, res) => {
  if (req.session.tutorLoggedIn) {
    res.redirect("/tutor/tutor_home");
  } else {
    res.render("tutor/tutor_login", { loginErr: req.session.tutorLoginErr });
    req.session.tutorLoginErr = false;
  }
});

router.post("/tutor_login", (req, res) => {
  tutorHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.tutor = response.tutor;
      req.session.tutorLoggedIn = true;
      res.redirect("/tutor/tutor_home");
    } else {
      req.session.tutorLoginErr = "Invalid username or password";
      res.redirect("/tutor/tutor_login");
    }
  });
});

router.get("/tutor_logout", (req, res) => {
  req.session.tutor = null;
  req.session.tutorLoggedIn = false;
  res.redirect("/");
});

//----------------------------PROFILE----------------------------------------

router.get("/tutor_profile", verifyLogin, async (req, res) => {
  tutorHelpers.getProfile(req.session.tutor._id).then((profile) => {
    res.render("tutor/tutor_profile", { tutor: req.session.tutor, profile });
  });
});

router.get("/tutor_profile/edit_profile", verifyLogin, async (req, res) => {
  tutorHelpers.getProfile(req.session.tutor._id).then((profile) => {
    res.render("tutor/edit_profile", { tutor: req.session.tutor, profile });
  });
});

router.post("/tutor_profile/edit_profile", verifyLogin, async (req, res) => {
  await tutorHelpers.changeProfile(req.body, req.session.tutor._id).then(() => {
    res.redirect("/tutor/tutor_profile");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/images/" + req.session.tutor._id + ".jpg");
    }
  });
});

//--------------------------STUDENT DETAILS---------------------------

router.get("/student_details", verifyLogin, async (req, res) => {
  await tutorHelpers.getAllStudents().then((students) => {
    res.render("tutor/student_details", { tutor: req.session.tutor, students });
  });
});

router.get("/student_details/add_student", verifyLogin, async (req, res) => {
  res.render("tutor/add_student", { tutor: req.session.tutor });
});

router.post("/student_details/add_student", verifyLogin, async (req, res) => {
  await tutorHelpers.addStudent(req.body).then(() => {
    res.redirect("/tutor/student_details/add_student");
  });
});

router.get("/student_details/edit_student/:id",verifyLogin,async (req, res) => {
    let stud = await tutorHelpers.getStudentDetails(req.params.id);
    res.render("tutor/edit_student", { tutor: req.session.tutor, stud });
  }
);

router.post(
  "/student_details/edit_student/:id",
  verifyLogin,
  async (req, res) => {
    await tutorHelpers.updateStudent(req.body, req.params.id).then(() => {
      res.redirect("/tutor/student_details");
    });
  }
);

router.get("/student_details/delete_student/:id",verifyLogin,async (req, res) => {
    await tutorHelpers.deleteStudent(req.params.id).then(() => {
      res.redirect("/tutor/student_details");
    });
  }
);

router.get("/student_details/each_student/:id",verifyLogin,async (req, res) => {
    let profile = await studentHelpers.getProfile(req.params.id);
    let assignments = await tutorHelpers.getSubmittedFiles(req.params.id);
    let attendance = await tutorHelpers.eachStudentAttendance(req.params.id);
    res.render("tutor/each_student", {
      tutor: req.session.tutor,
      profile,
      assignments,
      attendance,
    });
  }
);

//---------------------------ASSIGNMENTS-------------------------------------

router.get("/assignments", verifyLogin, async (req, res) => {
  await tutorHelpers.getAssignments().then((assignments) => {
    res.render("tutor/assignments", { tutor: req.session.tutor, assignments });
  });
});

router.post("/assignments/add_assignment", verifyLogin, async (req, res) => {
  await tutorHelpers.addAssignment(req.body, (id) => {
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/assignment_images/" + id + ".pdf", (err, done) => {
        if (!err) {
          res.redirect("/tutor/assignments");
        } else {
          console.log(err);
        }
      });
    }
  });
});

router.get("/showPDF/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("tutor/showPDF", { id });
});

router.get("/stud_PDF/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("student/stud_PDF", { id });
});

router.get("/assignments/delete_assignment/:id",verifyLogin,async (req, res) => {
    await tutorHelpers.deleteAssignment(req.params.id).then(() => {
      res.redirect("/tutor/assignments");
    });
  }
);

//----------------------------NOTES------------------------------

router.get("/notes", verifyLogin, async (req, res) => {
  await tutorHelpers.getNotes().then((notes) => {
    res.render("tutor/notes", { tutor: req.session.tutor, notes });
  });
});

router.post("/notes", verifyLogin, async (req, res) => {
  await tutorHelpers.addNotes(req.body, (id) => {
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/note_images/" + id + ".pdf");
    }
    if (req.files.Video) {
      let video = req.files.Video;
      video.mv("./public/videos/" + id + ".mp4");
    }
    res.redirect("/tutor/notes");
  });
});

router.get("/show_notesPDF/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("tutor/show_notesPDF", { id });
});

router.get("/show_notes_video/:id", verifyLogin, (req, res) => {
  let videoId = req.params.id;
  res.render("tutor/show_notes_video", { videoId });
});

router.get("/show_notes_yvideo/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("tutor/show_notes_yvideo", { id });
});

router.get("/notes/delete_note/:id", verifyLogin, async (req, res) => {
  await tutorHelpers.deleteNote(req.params.id).then(() => {
    res.redirect("/tutor/notes");
  });
});

//--------------------------ANNOUNCEMENT--------------------------------------

router.get("/announcements", verifyLogin, async (req, res) => {
  res.render("tutor/announcements", { tutor: req.session.tutor });
});

router.post("/announcements", verifyLogin, async (req, res) => {
  await tutorHelpers.addAnnouncement(req.body, (id) => {
    if (req.body.pdffile) {
      let pdf = req.files.PDF;
      pdf.mv("./public/announcement_pdf/" + id + ".pdf");
    }
    if (req.body.imagefile) {
      let image = req.files.Image;
      image.mv("./public/announcement_images/" + id + ".jpeg");
    }
    if (req.body.videofile) {
      let video = req.files.Video;
      video.mv("./public/announcement_videos/" + id + ".mp4");
    }
    res.redirect("/tutor/announcements");
  });
});

router.get("/each_announcement/:id", verifyLogin, async (req, res) => {
  let announcement = await tutorHelpers.getEachAnnouncement(req.params.id);
  res.render("tutor/each_announcement", {
    tutor: req.session.tutor,
    announcement,
  });
});

router.get("/view_announcementPDF/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("tutor/view_announcementPDF", { id });
});

//------------------------------EVENTS------------------------------------------

router.get("/events", verifyLogin, async (req, res) => {
  res.render("tutor/events", { tutor: req.session.tutor });
});

router.post("/events", verifyLogin, async (req, res) => {
  await tutorHelpers.addEvents(req.body, (id) => {
    if (req.body.pdffile) {
      let pdf = req.files.PDF;
      pdf.mv("./public/events_pdf/" + id + ".pdf");
    }
    if (req.body.imagefile) {
      let image = req.files.Image;
      image.mv("./public/events_images/" + id + ".jpeg");
    }
    if (req.body.videofile) {
      let video = req.files.Video;
      video.mv("./public/events_videos/" + id + ".mp4");
    }
    res.redirect("/tutor/events");
  });
});

router.get("/events/each_event/:id", verifyLogin, async (req, res) => {
  let event = await tutorHelpers.getEachEvent(req.params.id);
  if(event.method==='paid'){
    let status='true';
    res.render("tutor/each_event", { tutor: req.session.tutor, event,status});
  }else{
    res.render("tutor/each_event", { tutor: req.session.tutor, event});
  }
});

router.get("/reg_students/:id", verifyLogin, async (req, res) => {
  regstudents = await tutorHelpers.getRegStudents(req.params.id);
  res.render("tutor/reg_students", { tutor: req.session.tutor, regstudents });
});

router.get("/view_eventPDF/:id", verifyLogin, (req, res) => {
  let id = req.params.id;
  res.render("tutor/view_eventPDF", { id });
});

// ------------------------------ATTENDANCE------------------------------------------

router.get("/attendance/select_date", verifyLogin, (req, res) => {
  res.render("tutor/selectDate", { tutor: req.session.tutor });
});

router.post("/attendance", verifyLogin, async (req, res) => {
  let selectdate = req.body.selectdate;
  let day=req.body.selectday;
  let month=req.body.selectmonth;
  let year=req.body.selectyear;

  let present = await tutorHelpers.getPresentStudents(req.body.selectdate,day,month,year);
  let absent = await tutorHelpers.getAbsentStudents(req.body.selectdate,day,month,year);
  res.render("tutor/attendance", {
    tutor: req.session.tutor,
    present,
    absent,
    selectdate,
  });
});

// ----------------------------ADD PHOTOS--------------------------------------

router.get("/add_photos", verifyLogin, async (req, res) => {
  res.render("tutor/add_photos", { tutor: req.session.tutor });
});

router.post("/add_photos", verifyLogin, async (req, res) => {
  await tutorHelpers.addPhoto(req.body, (id) => {
    const image = req.body.cropped_image;
    base64Img.img(image, "./public/photos/", id, function (err, filepath) {
      //const pathArr=filepath.split('/')
      // const fileName=pathArr[pathArr.length-1];
    });
    res.redirect("/tutor/add_photos");
  });
});

router.get("/show_photos", verifyLogin, async (req, res) => {
  tutorHelpers.getAllPhotos().then((photos) => {
    res.render("tutor/show_photos", { tutor: req.session.tutor, photos });
  });
});

module.exports = router;
