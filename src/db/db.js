const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

function connectdb(){
    mongoose.connect(process.env.MONGOURI).then(()=>console.log("Hogaya Connect !")).catch((err)=>console.log(err));
}

module.exports  = connectdb;