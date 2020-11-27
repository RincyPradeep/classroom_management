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
    }

}