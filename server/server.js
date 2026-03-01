require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");

const app = express();

/* =====================================================
   DNS FIX (HOTSPOT / SRV CONNECTION ISSUE)
===================================================== */
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Deep patch: Force Node.js to use Google DNS for mongodb.net lookups
// because the local network (172.x) sometimes blocks or fails to resolve it.
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (hostname && hostname.includes("mongodb.net")) {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) return originalLookup(hostname, options, callback);
      callback(null, addresses[0], 4);
    });
  } else {
    originalLookup(hostname, options, callback);
  }
};

/* =====================================================
   MIDDLEWARE
===================================================== */
app.use(cors());
app.use(express.json());

/* =====================================================
   ROUTES
===================================================== */

// 🔐 Authentication 
app.use("/api/auth", require("./routes/auth"));

// 📅 Routines (This fixes the 404 error and connects React to your DB!)
app.use("/api/routines", require("./routes/routines"));

// ➕ Extra Tasks (Uncomment this when you are ready to use the extra tasks feature)
app.use("/api/extra-tasks", require("./routes/extraTasks"));

/* =====================================================
   MONGODB CONNECTION
===================================================== */
const MONGO_URI =
  "mongodb+srv://raze_db_user:lock20123@cluster0.q6sbadu.mongodb.net/brightSteps?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, { family: 4 })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:");
    console.error(err.message);
    process.exit(1);
  });

/* =====================================================
   HEALTH CHECK ROUTES
===================================================== */
app.get("/", (req, res) => {
  res.send("🚀 BrightSteps API is running...");
});

/* =====================================================
   SERVER START
===================================================== */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});