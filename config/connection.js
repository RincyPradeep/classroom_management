/* code for mongodb connection */

const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
//const url='mongodb+srv://Poomattathil:Poomattathil@cluster0.qbhoh.mongodb.net/classroom?retryWrites=true&w=majority';
//const url='mongodb://localhost:27017';
module.exports.connect=function(done){
    const url='mongodb+srv://Poomattathil:eLDKzLav72F4H0uP@cluster0.qbhoh.mongodb.net/classroom?retryWrites=true&w=majority';
    const dbname='classroom';

    mongoClient.connect(url,{useUnifiedTopology: true},(err,data)=>{
        if(err)
        return done(err);
        
        state.db=data.db(dbname);
        done()
    })
}

module.exports.get=function(){
    return state.db
}