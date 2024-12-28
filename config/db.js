<<<<<<< HEAD

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
>>>>>>> a1222b3a723a2d3bac8107802ecb2ca1cf61aba3
