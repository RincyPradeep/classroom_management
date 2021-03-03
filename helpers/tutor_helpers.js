var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
var objectId = require("mongodb").ObjectId;
const { ATTENDANCE_COLLECTION } = require("../config/collections");

module.exports = {
  doLogin: (tutorData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let tutor = await db
        .get()
        .collection(collection.TUTOR_COLLECTION)
        .findOne({ username: tutorData.Username });

      if (tutor) {
        bcrypt.compare(tutorData.Password, tutor.password).then((status) => {
          if (status) {
            console.log("Login Success");
            response.tutor = tutor;
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

  getProfile: (tutorId) => {
    return new Promise(async (resolve, reject) => {
      let profile = await db
        .get()
        .collection(collection.TUTOR_COLLECTION)
        .findOne({ _id: objectId(tutorId) });
      resolve(profile);
    });
  },
  changeProfile: (data, tutorId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.TUTOR_COLLECTION)
        .updateOne(
          { _id: objectId(tutorId) },
          {
            $set: {
              name: data.name,
              gender: data.gender,
              mobile: data.mobile,
              job: data.job,
              email: data.email,
              class: data.class,
              address: data.address,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  eachStudentAttendance: (studentId) => {
    let result = [];
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    let pastDate = new Date().getDate() - 7;
    return new Promise(async (resolve, reject) => {
      for (i = 1; i <= 7; i++) {
        let obj = {};
        let check_date = new Date(
          year,
          month,
          pastDate + 1
        ).toLocaleDateString();
        console.log("check_date:", check_date);
        let attdate = await db
          .get()
          .collection(collection.STUDENT_COLLECTION)
          .findOne({
            $and: [
              { _id: objectId(studentId) },
              { status: "active" },
              { attendance: { $in: [check_date] } },
            ],
          });
        console.log("attdate:", attdate);
        if (attdate) {
          obj.date = check_date;
          obj.status = "present";
          result.push(obj);
        } else {
          obj.date = check_date;
          obj.status = "absent";
          result.push(obj);
        }
        pastDate = pastDate + 1;
      }
      resolve(result);
    });
  },

  addStudent: (studentData) => {
    return new Promise(async (resolve, reject) => {
      studentData.password = await bcrypt.hash(studentData.password, 10);
      studentData.status = "active";
      await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .insertOne(studentData)
        .then(() => {
          // callback(data.ops[0]._id);
          resolve();
        });
    });
  },
  getAllStudents: () => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .find({ status: "active" })
        .sort({ name: 1 })
        .toArray()
        .then((students) => {
          resolve(students);
        });
    });
  },

  getStudentDetails: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .findOne({ _id: objectId(id) })
        .then((student) => {
          resolve(student);
        });
    });
  },
  updateStudent: (student, id) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.STUDENT_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              rollno: student.rollno,
              name: student.name,
              gender: student.gender,
              phone: student.phone,
              username: student.username,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  deleteStudent: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              status: "deleted",
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },

  addAssignment: (asmntdata, callback) => {
    //asmntdata.date = new Date().toLocaleDateString();
    var day=new Date()
    var date=day.getDate();
    var month=day.getMonth()+1;
    var year=day.getFullYear();
    asmntdata.date =date+"/"+month+"/"+year;
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .insertOne(asmntdata)
        .then((data) => {
          callback(data.ops[0]._id);
        });
    });
  },
  getAssignments: () => {
    return new Promise(async (resolve, reject) => {
      let assignments = await db
        .get()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .find()
        .toArray();
      resolve(assignments);
    });
  },

  getAssignmentFilename: (id) => {
    return new Promise(async (resolve, reject) => {
      let assignment = await db
        .get()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .find({ _id: id });
      resolve(assignment);
    });
  },

  deleteAssignment: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ASSIGNMENT_COLLECTION)
        .removeOne({ _id: objectId(id) })
        .then(() => {
          resolve();
        });
    });
  },

  getSubmittedFiles: (studentId) => {
    return new Promise(async (resolve, reject) => {
      let assignments = db
        .get()
        .collection(collection.SUB_ASSIGNMENT_COLLECTION)
        .find({ studId: objectId(studentId) })
        .toArray();
      resolve(assignments);
    });
  },

  addNotes: (notedata, callback) => {
    //notedata.date = new Date().toLocaleDateString();
    //console.log("DATE",notedata.date)
    var day=new Date()
    var date=day.getDate();
    var month=day.getMonth()+1;
    var year=day.getFullYear();
    notedata.date =date+"/"+month+"/"+year;
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.NOTE_COLLECTION)
        .insertOne(notedata)
        .then((data) => {
          callback(data.ops[0]._id);
        });
    });
  },

  getNotes: () => {
    return new Promise(async (resolve, reject) => {
      let notes = await db
        .get()
        .collection(collection.NOTE_COLLECTION)
        .find()
        .toArray();
      resolve(notes);
    });
  },

  deleteNote: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.NOTE_COLLECTION)
        .removeOne({ _id: objectId(id) })
        .then(() => {
          resolve();
        });
    });
  },

  addAnnouncement: (annmntdata, callback) => {
    annmntdata.date = new Date().toLocaleDateString();
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .insertOne(annmntdata)
        .then((data) => {
          callback(data.ops[0]._id);
        });
    });
  },

  getAnnouncement: () => {
    return new Promise(async (resolve, reject) => {
      let announcement = await db
        .get()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .find()
        .toArray();
      resolve(announcement);
    });
  },

  getEachAnnouncement: (id) => {
    return new Promise(async (resolve, reject) => {
      let announcement = await db
        .get()
        .collection(collection.ANNOUNCEMENT_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(announcement);
    });
  },

  addEvents: (eventdata, callback) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.EVENT_COLLECTION)
        .insertOne(eventdata)
        .then((data) => {
          callback(data.ops[0]._id);
        });
    });
  },

  getEvent: () => {
    return new Promise(async (resolve, reject) => {
      let event = await db
        .get()
        .collection(collection.EVENT_COLLECTION)
        .find()
        .toArray();
      resolve(event);
    });
  },

  getEachEvent: (id) => {
    return new Promise(async (resolve, reject) => {
      let event = await db
        .get()
        .collection(collection.EVENT_COLLECTION)
        .findOne({ _id: objectId(id) });
      resolve(event);
    });
  },

  getRegStudents: (eventId) => {
    return new Promise(async (resolve, reject) => {
      let regstudents = await db
        .get()
        .collection(collection.PAYMENT_COLLECTION)
        .aggregate([
          {
            $match: { eventId: eventId, status: "placed" },
          },
          {
            $lookup: {
              from: collection.STUDENT_COLLECTION,
              localField: "studentId",
              foreignField: "_id",
              as: "student",
            },
          },
          {
            $project: {
              student: { $arrayElemAt: ["$student", 0] },
              rollno: "$student.rollno",
              name: "$student.name",
            },
          },
        ])
        .toArray();
      resolve(regstudents);
    });
  },

  addPhoto: (name, callback) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.PHOTO_COLLECTION)
        .insertOne(name)
        .then((data) => {
          callback(data.ops[0]._id);
        });
    });
  },

  getAllPhotos: () => {
    return new Promise(async (resolve, reject) => {
      let photos = await db
        .get()
        .collection(collection.PHOTO_COLLECTION)
        .find()
        .toArray();
      resolve(photos);
    });
  },

  getPresentStudents: (selectDate,day,month,year) => {
    console.log("Select Date:",selectDate)
    console.log("INITIAL DAY:",day)
    month=parseInt(month)
    console.log("MONTHHH",month)
    day=parseInt(day)
    console.log("DAYYYY:",day)
    let d =day+"/"+month+"/"+year;
    console.log("DDDATE",d)
    return new Promise(async (resolve, reject) => {
      let present = await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .find({ status: "active", attendance: d })
        .toArray();
      resolve(present);
    });
  },

  getAbsentStudents: (selectDate,day,month,year) => {
    month=parseInt(month)
    let d =day+"/"+month+"/"+year;
    return new Promise(async (resolve, reject) => {
      let absent = await db
        .get()
        .collection(collection.STUDENT_COLLECTION)
        .find({ status: "active", attendance: { $ne: d } })
        .toArray();
      resolve(absent);
    });
  },
};
