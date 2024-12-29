<<<<<<< HEAD

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI,{
       useNewUrlParser: true,
      useUnifiedTopology: true,
       
});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};


export default connectDB;
=======

import mongoose from 'mongoose';


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};


export default connectDB;
>>>>>>> 3505c18545e7906a1ea862ec88b59b9daace3699
