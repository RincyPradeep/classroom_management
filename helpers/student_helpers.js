var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");

var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");

var instance = new Razorpay({
  key_id: "rzp_test_aUQBLsVRSkPESU",
  key_secret: "1stu7ImAL7WjPeKN9CHXbTQY",
});


module.exports = {
  doLogin: (studentData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};

      let student = await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ username: studentData.Username }, { status: "active" });

      if (student) {
        bcrypt
          .compare(studentData.Password, student.password)
          .then((status) => {
            if (status) {
              console.log("Login Success");
              response.student = student;
              response.status = true;
              resolve(response);
            } else {
              console.log("Login Failed");
              resolve({ status: false });
            }
          });
      } else {
        console.log("Login Failed");
        resolve({ status: false });
      }
    });
  },
  
  getProfile: (studentId) => {
    return new Promise(async (resolve, reject) => {
      let student = db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: objectId(studentId) });
      resolve(student);
    });
  },
  verifyNumber: (number) => {
    
    let num = number.toString();
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ phone: num })
        .then((student) => {
          console.log(student);
          if (student) {
            resolve(student);
          } else {
            console.log("No matching student");

            resolve({ status: false });
          }
        });
    });
  },

  newAssignments:(studentId)=>{
    return new Promise(async(resolve,reject)=>{
      let assignments=await db.get().collection(collection.ASSIGNMENT_COLLECTION)
      .find({submits:{$ne : studentId}}).toArray()
      resolve(assignments)
    })
  },

  getTopicName:(Id)=>{
    let response={}
    return new Promise(async(resolve,reject)=>{
      let assignment=await db.get().collection(collection.ASSIGNMENT_COLLECTION)
      .findOne({_id:objectId(Id)})
      response.topic=assignment.topic
      response.assignmentId=Id
      resolve(response)
    })
  },
  submitAssignment:(data,studentId)=>{
    data.studId=studentId
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.ASSIGNMENT_COLLECTION)
        .updateOne(
          { _id: objectId(data.asmntId) },
          {
            $push: { submits: studentId },
          }
        )
      await db.get().collection(collection.SUB_ASSIGNMENT_COLLECTION)
      .insertOne(data).then((data)=>{
        
        console.log("Submitted Successfully!")
        resolve(data.ops[0]._id)
        
      })
    })
  },
  getNotes:(studentId)=>{
    return new Promise(async(resolve,reject)=>{
      await db.get().collection(collection.NOTE_COLLECTION)
      .find().toArray().then((notes)=>{
        resolve(notes)
      })
    })
  },
  getTodaysNote:()=>{
    let today=new Date().toLocaleDateString()
     return new Promise(async(resolve,reject)=>{
      let note=await db.get().collection(collection.NOTE_COLLECTION)
      .find({date:today}).toArray()
        if(note){
        resolve(note)
        }else{
          resolve({status:false})
        }
      })
  },
  getTodaysAssignment:()=>{
    let today=new Date().toLocaleDateString()
    return new Promise(async(resolve,reject)=>{
     let assignment=await db.get().collection(collection.ASSIGNMENT_COLLECTION)
     .find({date:today}).toArray()
       if(assignment){
       resolve(assignment)
       }else{
         resolve({status:false})
       }
     })
  },

  checkAlreadyPaid:(studId,eveId)=>{
    console.log(studId)
    console.log(eveId)
return new Promise(async(resolve,reject)=>{
 let alreadyPaid = await db.get().collection(collection.PAYMENT_COLLECTION)
  .findOne({studentId:objectId(studId) , eventId:objectId(eveId), status:'placed'})
  console.log("AAAAAAAAAAaa",alreadyPaid)
  if(alreadyPaid){
    resolve(true)
  }
  else{
    resolve(false)
  }
  
})
  },

  addPaymentDetails:(studentId,eventId,amount)=>{
    return new Promise((resolve,reject)=>{
      let payObj = {
        studentId:studentId,
        eventId:eventId,
        amount:amount,
        status:'pending',
        date: new Date().toLocaleString()
      }
      db.get()
      .collection(collection.PAYMENT_COLLECTION)
      .insertOne(payObj)
      .then((response) => {
        resolve(response.ops[0]._id);
      });
    })
  },
  generateRazorpay:(orderId,amount)=>{
    return new Promise((resolve,reject)=>{
      var options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "" + orderId,
        
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
  })
},
verifyPayment: (details) => {
  return new Promise((resolve, reject) => {
    /* From documentation */
    const crypto = require("crypto");
    let hmac = crypto.createHmac(
      "sha256",
      "1stu7ImAL7WjPeKN9CHXbTQY"
    ); /*Seccret key of razorpay */
    hmac.update(
      details["payment[razorpay_order_id]"] +
        "|" +
        details["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex"); /* convert to hexa code */
    if (hmac == details["payment[razorpay_signature]"]) {
      resolve();
    } else {
      reject();
    }
  });
},

changePaymentStatus: (orderId) => {
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.PAYMENT_COLLECTION)
      .updateOne(
        { _id: objectId(orderId) },
        {
          $set: {
            status: "placed"
          }
        }
      )
      .then(() => {
        resolve();
      });
  });
},
  
  
  // markAttendance:(studentId,videoId)=>{
          
  //   return new Promise(async(resolve, reject) => {
  //     let note = await db.get().collection(collection.NOTE_COLLECTION)
  //     .findOne({_id:objectId(videoId)}) 

  //     let student = await db.get().collection(collection.ATTENDANCE_COLLECTION)
  //     .findOne({studentId:studentId})
  //     if(student){
  //       let dateexist=await db.get().collection(collection.ATTENDANCE_COLLECTION)
  //       .findOne({attendance:note.date})
  //     if(!dateexist){
  //       await db.get().collection(collection.ATTENDANCE_COLLECTION)
  //       .updateOne({studentId:studentId},
  //         {
  //           $push:{attendance:note.date},
  //         }
  //         ).then(()=>{
  //           resolve()
  //         })
  //       }else{
  //         resolve()
  //       }
  //     }else{
  //       await db.get().collection(collection.ATTENDANCE_COLLECTION)
  //       .insertOne({studentId:studentId})
        
  //       await db.get().collection(collection.ATTENDANCE_COLLECTION)
  //       .updateOne({studentId:studentId},
  //         {
  //           $push:{attendance:note.date},
  //         }
  //         )
  //       .then(()=>{
  //         resolve()
  //       })
  //   } 
  // })
  //   }

  markAttendance:(studentId,videoId)=>{
          
    return new Promise(async(resolve, reject) => {
      let note = await db.get().collection(collection.NOTE_COLLECTION)
      .findOne({_id:objectId(videoId)}) 

      
        let dateexist=await db.get().collection(collection.STUDENT_COLLECTION)
        .findOne({_id:studentId, attendance:note.date})
      if(!dateexist){
        
        await db.get().collection(collection.STUDENT_COLLECTION)
        .updateOne({_id:studentId},
          {
            $push:{attendance:note.date},
          }
          ).then(()=>{
            resolve()
          })
        }else{
          
          resolve()
        }
       
  })
    }

};
