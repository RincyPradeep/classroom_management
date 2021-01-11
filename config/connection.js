/* code for mongodb connection */

const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
//mongodb://localhost:27017
module.exports.connect=function(done){
const url='mongodb+srv://Poomattathil:<password>@cluster0.qbhoh.mongodb.net/<dbname>?retryWrites=true&w=majority';
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