import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const dbName = 'UTS';
        const dbURI = `mongodb://localhost:27017/${dbName}`;
        await mongoose.connect(dbURI);
        console.log(`Connected to MongoDB: ${dbName}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

export default connectDB;
