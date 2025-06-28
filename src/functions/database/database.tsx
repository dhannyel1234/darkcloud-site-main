import mongoose from "mongoose";
const MONGODB_URI = "mongodb+srv://darkcloud:9YZxZu4gl4oJtwWn@cluster0.xlm3ycp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const connect = async () => {
    if (mongoose.connection.readyState === 0) {
        return await mongoose.connect(MONGODB_URI);
    };
};

const disconnect = async () => {
    if (mongoose.connection.readyState !== 0) {
        return await mongoose.disconnect();
    };
};

const database = { connect, disconnect };
export default database;