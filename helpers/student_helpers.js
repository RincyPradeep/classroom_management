var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
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
};
