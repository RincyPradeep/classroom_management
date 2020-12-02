var db=require('../config/connection');
var collection=require('../config/collections')
const bcrypt=require('bcrypt');
var objectId=require('mongodb').ObjectId

module.exports={
    doLogin:(tutorData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={} 

            let tutor=await db.get().collection(collection.TUTOR_COLLECTION).findOne({username:tutorData.Username})
            
            if(tutor){
                    bcrypt.compare(tutorData.Password,tutor.password).then((status)=>{
                    if(status){
                        console.log("Login Success");
                        response.tutor=tutor
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("Login Failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("Login Failed");
                resolve({status:false})
            }
        })
    },
    getTutorName:(tutorId)=>{
        return new Promise(async(resolve,reject)=>{
            let tutor=await db.get().collection(collection.TUTOR_COLLECTION)
            .findOne({_id:objectId(tutorId)})
            resolve(tutor.name)
        })

    },

    getProfile:(tutorId)=>{
        return new Promise(async(resolve,reject)=>{
            let profile=await db.get().collection(collection.TUTOR_COLLECTION).findOne({_id:objectId(tutorId)})
            resolve(profile)
        })
    },
    changeProfile:(data,tutorId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.TUTOR_COLLECTION)
            .updateOne({_id:objectId(tutorId)},{
                $set:{
                    name:data.name,
                    gender:data.gender,
                    mobile:data.mobile,
                    job:data.job,
                    email:data.email,
                    class:data.class,
                    address:data.address
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    addStudent:(studentData,callback)=>{
        return new Promise(async(resolve,reject)=>{
            studentData.password = await bcrypt.hash(studentData.password, 10);
            studentData.status="active"
            await db.get().collection(collection.STUDENT_COLLECTION)
            .insertOne(studentData).then((data)=>{
                callback(data.ops[0]._id);
                // resolve()
            })
        })
    },
    getAllStudents:()=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.STUDENT_COLLECTION)
            .find({status:"active"}).toArray().then((students)=>{
                resolve(students)
            })

        })
    },
    getStudentDetails:(id)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.STUDENT_COLLECTION)
            .findOne({_id:objectId(id)}).then((student)=>{
                resolve(student)

            })
        })
    },
    updateStudent:(student,id)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.STUDENT_COLLECTION)
            .updateOne({_id:objectId(id)},{
                $set:{
                    rollno:student.rollno,
                    name:student.name,
                    gender:student.gender,
                    phone:student.phone,
                    username:student.username
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    deleteStudent:(id)=>{
        return new Promise(async(resolve,reject)=>{
        
            await db.get().collection(collection.STUDENT_COLLECTION)
            .updateOne({_id:objectId(id)},{
                $set:{
                    status:"deleted"
                }
            }).then(()=>{
                resolve()
            })
        })
    }

}