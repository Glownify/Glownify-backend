import cron from "node-cron";
import axios from "axios";

// Function to ping your deployed app
const pingApp = async () => {
  try {
    const response = await axios.get("https://saloonbackend-mumt.onrender.com/");
    console.log("✅ Ping successful at", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("❌ Ping failed:", error.message);
  }
};

// Schedule the cron job to run every 14 minutes
cron.schedule("*/14 * * * *", () => {
  console.log("⏰ Running scheduled ping...");
  pingApp();
});

export default pingApp;
