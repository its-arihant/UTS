import mongoose from 'mongoose';

const uri = "mongodb+srv://itsarihant18:ZyhbMUCmjSWshHNQ@cluster0.gs6mye7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Other options if needed
    });
    console.log("You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

export default connectDB;
