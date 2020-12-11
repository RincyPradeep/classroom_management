var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { default: Swal } = require("sweetalert2");
var objectId = require("mongodb").ObjectId;

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
  getStudentName: (studentId) => {
    return new Promise(async (resolve, reject) => {
      let student = await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: objectId(studentId) });
      resolve(student.name);
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
      await db.get().collection(collection.NOTE_COLLECTION)
      .findOne({date:today}).then((note)=>{
        if(note){
        resolve(note)
        }else{
          resolve({status:false})
        }
      })
    })
  },
  getTodaysAssignment:()=>{
    let today=new Date().toLocaleDateString()
    return new Promise(async(resolve,reject)=>{
     await db.get().collection(collection.ASSIGNMENT_COLLECTION)
     .findOne({date:today}).then((assignment)=>{
       if(assignment){
       resolve(assignment)
       }else{
         resolve({status:false})
       }
     })
   })
  }

  

};

{/* <script> 
            var up = document.getElementById('GFG_UP'); 
            var d = '12/05/2019 12:00:00 AM'; 
            up.innerHTML = d; 
            var down = document.getElementById('GFG_DOWN');  
              
            function GFG_Fun() { 
                down.innerHTML = d.split(' ')[0];; 
            } 
        </script>  
       */}