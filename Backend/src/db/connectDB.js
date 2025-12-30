import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

async function connectDB (){
    try{
        await mongoose.connect(`${process.env.MONGO_URI}`)
        console.log("Connected to the DB")
    }catch(error){
        console.log(error);
        console.log("error while connecting to the DB")
    }
}

export {connectDB}