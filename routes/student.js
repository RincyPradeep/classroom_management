var express = require("express");
var router = express.Router();
var studentHelpers = require("../helpers/student_helpers");
var tutorHelpers = require("../helpers/tutor_helpers");
const messagebird = require("messagebird")("L4cnY2R2jht4tkypehqF2M8qm");

const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AVq9zXE_jg3mRyjPLhpa0kBy3BnWS_gE_NyydRoEY749moxCQ4PSj-E-PXSWqjMCIxEKCV8QBf_Ferzx',
  'client_secret': 'ENimWy6m9pexxEX8toU5ZzYbSeMHJH7F4WcLie7zNloIVwdcIP6Ann27QQxPM9CLStTKl_VMMSAbgCqD'
});

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

/* GET Home page */
router.get("/student_home", verifyLogin, async (req, res) => {
  let event=await tutorHelpers.getEvent()
  let announcement=await tutorHelpers.getAnnouncement()
  res.render("student/student_home", {
    student: req.session.student,
    id: req.session.student._id,
    announcement,event
  });
});

//------------------LOGIN-----------------------

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
      req.session.studentLoggedIn = true;
      let announcement=await tutorHelpers.getAnnouncement()
      res.render("student/student_home", { student:req.session.student ,announcement});
    }
  });
});

//-----------------------PROFILE-------------------------

router.get("/student_profile", verifyLogin, async (req, res) => {
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

//----------------------ASSIGNMENT------------------------

router.get("/student_assignments",verifyLogin,async(req,res)=>{
  await studentHelpers.newAssignments(req.session.student._id).then((assignments)=>{
  res.render("student/stud_assignments", { student:req.session.student ,assignments});
})
})

router.get("/showPDF/:id",verifyLogin,(req,res)=>{
  let id=req.params.id
  res.render("tutor/showPDF",{id})
})

router.get("/assignments/submit_assignment/:id",verifyLogin,async(req,res)=>{
  await studentHelpers.getTopicName(req.params.id).then((response)=>{
    let topic=response.topic
    let assignmentId=response.assignmentId
    res.json({topic,assignmentId})
  })
})

router.post("/assignments/submit_assignment",async(req,res)=>{
 await studentHelpers.submitAssignment(req.body,req.session.student._id).then((id)=>{ 
  let image = req.files.uploadfile;
  image.mv("./public/sub_assignment_images/" + id + ".pdf", (err, done) => {
    if (!err) {
      //res.redirect("/student_assignments")
      res.json('true')
    } else {
      console.log(err);
      res.json({err})
    }
  });
 })
})

//------------------------NOTES-----------------------------------

router.get("/student_notes",verifyLogin,async(req,res)=>{
  await studentHelpers.getNotes(req.session.student._id).then((notes)=>{
  res.render("student/stud_notes", { student:req.session.student,notes});
})
})

router.get("/show_notes_video/:id",verifyLogin,async(req,res)=>{
  let videoId=req.params.id
  let studentId=req.session.student._id
  await studentHelpers.markAttendance(studentId,videoId)
  res.render("tutor/show_notes_video",{videoId})
})

//------------------------TODAYS TASK-----------------------------------

router.get("/student_todays_task",verifyLogin,async(req,res)=>{
  let note= await studentHelpers.getTodaysNote()
  let assignment= await studentHelpers.getTodaysAssignment()
  res.render("student/todays_task", { student: req.session.student,note,assignment});
})

//------------------------ANNOUNCEMENT-----------------------------------

router.get("/student_announcements",verifyLogin,async(req,res)=>{
  let announcement=await tutorHelpers.getAnnouncement()
  res.render("student/stud_announcement",{student:req.session.student,announcement})
})

router.get("/each_announcement/:id",verifyLogin,async(req,res)=>{
  let announcement=await tutorHelpers.getEachAnnouncement(req.params.id)
  res.render("student/each_announcement",{student:req.session.student,announcement})
})

//------------------------EVENTS-----------------------------------

router.get("/student_events",verifyLogin,async(req,res)=>{
  let event=await tutorHelpers.getEvent()
  res.render("student/stud_events",{student:req.session.student,event})
})

router.get("/each_event/:id",verifyLogin,async(req,res)=>{
  let event=await tutorHelpers.getEachEvent(req.params.id)
  let alreadyPaid = await studentHelpers.checkAlreadyPaid(req.session.student._id,req.params.id)
  
   
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

//------------------------PAYMENT-----------------------------------

router.post('/paymentmethod',(req,res)=>{
  console.log("%%%%%",req.body)
  var studentId=req.session.student._id;
    var eventId=req.body.eventId;
    var amount=req.body.amount;
  if(req.body.paymentMethod === 'true'){
    console.log("Razorpay")
    studentHelpers.addPaymentDetails(studentId,eventId,amount).then((orderId)=>{
      console.log("ORDERID:",orderId)
         studentHelpers.generateRazorpay(orderId,amount).then((response)=>{     
          //res.json({status:true,eventId,amount})
          response.status='true';
          console.log("RESPONSE:",response)
          res.json(response)
         })
        })
  }else if(req.body.paymentMethod === 'false'){
    console.log("Paypal")
    res.json({status:false,eventId,amount})
  }
})

// router.get('/razorpay_amount/:status/:id/:amount',(req,res)=>{
//   var status = req.params.status;
//   var eventId=req.params.id;
//   var amount=req.params.amount;
//   res.render("student/razorpay_amount",{student:req.session.student,eventId,status,amount})
// })

router.get('/paypal_amount/:status/:id/:amount',(req,res)=>{
  var status = req.params.status;
  var eventId=req.params.id;
  var amount=req.params.amount;
  console.log("##########",status,eventId)
  res.render("student/paypal_amount",{student:req.session.student,eventId,status,amount})
})

// router.post("/razorpay_verify",verifyLogin,async(req,res)=>{
//   console.log("R.Verify------------:",req.body)
//    studentHelpers.addPaymentDetails(req.body.studentId,req.body.eventId,req.body.amount).then((orderId)=>{
//      console.log("ORDERID:",orderId)
//         studentHelpers.generateRazorpay(orderId,req.body.amount).then((response)=>{     
        
//         })
//    })
// })
 
router.post("/paypal_verify",verifyLogin,async(req,res)=>{
  console.log("******************")
let amount=req.body.amount;
let eventId=req.body.eventId;
amount= parseInt(amount);
  console.log(req.body)
        const create_payment_json = {
          "intent": "sale",
          "payer": {
              "payment_method": "paypal"
          },
          "redirect_urls": {
              "return_url": "http://localhost:3000/success/" + amount + '/' + eventId,
              "cancel_url": "http://localhost:3000/cancel"
          },
          "transactions": [{
              "item_list": {
                  "items": [{
                      "name": "Red Sox Hat",
                      "sku": "001",
                      "price": amount,
                      "currency": "USD",
                      "quantity": 1
                  }]
              },
              "amount": {
                  "currency": "USD",
                  "total": amount
              },
              "description": "Hat for the best team ever"
          }]
      };
      
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++){
              if(payment.links[i].rel === 'approval_url'){
                res.redirect(payment.links[i].href);                
              }
            }
        }
      });        
})

router.get('/success/:amount/:eventId', (req, res) => {
  
  let amount=req.params.amount;
  let eventId=req.params.eventId;
  let studentId=req.session.student._id;
  console.log("@@@@@@@@@@@",studentId)
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        //console.log(JSON.stringify(payment));
        studentHelpers.addPaypalPayment(amount,eventId,studentId).then(()=>{
          console.log("Payed Successfully");
          res.redirect("/student_events")
        })
        
       
    }
});
});

router.get('/cancel', (req, res) => res.send('Cancelled'));
// //--------------------------------------------------------------------------------------
router.post("/verify-payment",verifyLogin,(req,res)=>{
  console.log("???????????????????",req.body)
  studentHelpers.verifyPayment(req.body).then(()=>{
    studentHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: "" });
  });
})

// -----------------------ATTENDANCE---------------------------------------------

router.get("/student_attendance/select_month",verifyLogin,async(req,res)=>{
  res.render("student/stud_selectMonth",{student:req.session.student})
})

router.post("/attendance",verifyLogin,async(req,res)=>{
  let selectmonth=req.body.selectmonth
  let month=req.body.month
  let year=req.body.year
  await studentHelpers.getAttendance(month,year,req.session.student._id).then((result)=>{
  res.render("student/stud_attendance",{student:req.session.student,result,selectmonth})
})
})

//---------------------------PHOTOS-----------------------------------

router.get("/student_photos",verifyLogin,async(req,res)=>{
  tutorHelpers.getAllPhotos().then((photos)=>{
res.render("student/stud_photos",{student:req.session.student,photos})
  })
})


module.exports = router;
