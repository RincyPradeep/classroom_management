var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");

var objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
require('dotenv').config();

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

module.exports = {
  doLogin: (studentData) => {
    return new Promise(async (resolve, reject) => {
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
    var day=new Date()
    var date=day.getDate();
    var month=day.getMonth()+1;
    var year=day.getFullYear();
    var today =date+"/"+month+"/"+year;

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
    var day=new Date()
    var date=day.getDate();
    var month=day.getMonth()+1;
    var year=day.getFullYear();
    var today =date+"/"+month+"/"+year;
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
//------------------------------------------------------------------------------
  checkAlreadyPaid:(studId,eveId)=>{
    console.log(studId)
    console.log(eveId)
return new Promise(async(resolve,reject)=>{
 let alreadyPaid = await db.get().collection(collection.PAYMENT_COLLECTION)
  .findOne({studentId:objectId(studId) , eventId:eveId, status:'placed'})
  console.log(alreadyPaid)
  if(alreadyPaid){
    resolve('true')
  }
  else{
    resolve('false')
  } 
})
  },

  addPaymentDetails:(studentId,eventId,amount)=>{
    return new Promise((resolve,reject)=>{
      let payObj = {
        studentId:objectId(studentId),
        eventId:eventId,
        amount:amount,
        status:'pending',
        date: new Date().toLocaleDateString()
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

addPaypalPayment:(amount,eventId,studentId)=>{
  let date=new Date().toLocaleDateString();
  let obj={studentId:studentId,eventId:eventId,amount:amount,status:'placed',date:date}
  return new Promise((resolve, reject) => {
    db.get()
      .collection(collection.PAYMENT_COLLECTION)
      .insertOne(obj)
      .then(() => {
        resolve();
      });
  });
},
 
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
    },

  getAttendance:(month,year,studentId)=>{   
     
      return new Promise(async(resolve,reject)=>{       
        let no_ofdays=new Date(year,month,0).getDate();
        console.log("No of days:",no_ofdays)
        console.log("Month:",month)
        let result=[];
        let pcount=0;
        let acount=0;
        for(let i=1;i<=no_ofdays;i++){
          let obj={};       
          let d=i+"/"+month+"/"+year;         
        let student = await db.get().collection(collection.STUDENT_COLLECTION)
        .findOne({$and:[{_id:objectId(studentId)}, {status:'active'}, {attendance: { $in: [d] }}]})
        console.log("DATE:",d)
          console.log("STUDENT:",student)
        if(student){
          pcount=pcount+1;
          obj.date=d;
          obj.status='present';
          result.push(obj);
        }else{
          acount=acount+1;
          obj.date=d;
          obj.status='absent';
          result.push(obj);
        }       
      }
      let bj={};
      let percentage=((pcount/no_ofdays)*100).toFixed(2);
      bj.noofdays=no_ofdays;
      bj.pcount=pcount;
      bj.acount=acount;
      bj.percentage=percentage+"%";
      result.push(bj);
        resolve(result)
      })
    }

};

