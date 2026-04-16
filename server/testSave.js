require("dotenv").config();
const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

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

const Routine = require("./models/Routine");

const URI = "mongodb+srv://raze_db_user:lock20123@cluster0.q6sbadu.mongodb.net/brightSteps?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(URI, { family: 4 })
    .then(async () => {
        console.log("Connected to DB");
        try {
            const doc = new Routine({
                title: "Test Routine Save",
                goal: "Did it save?",
                type: "adhd",
                cls: "morning"
            });
            const saved = await doc.save();
            console.log("Saved successfully:", saved);
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            process.exit(0);
        }
    })
    .catch(e => {
        console.error("Connection failed", e);
        process.exit(1);
    });
