const mongoose = require("mongoose");
const configDB = async (dbURL) => {
    try {
      await mongoose.connect(dbURL, {  // ✅ URL is passed as a parameter
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
      console.error("❌ MongoDB Connection Failed:", error);
      process.exit(1);
    }
  };
  
  module.exports = configDB;
  