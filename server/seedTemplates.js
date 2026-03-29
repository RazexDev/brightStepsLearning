require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");
const RoutineTemplate = require("./models/RoutineTemplate");
const Child = require("./models/Child");

const MONGO_URI =
  "mongodb+srv://raze_db_user:lock20123@cluster0.q6sbadu.mongodb.net/brightSteps?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, { family: 4 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

async function seed() {
  await RoutineTemplate.deleteMany();
  await Child.deleteMany();

  const adhdTemplate = new RoutineTemplate({
    title: "ADHD Morning Routine",
    conditionType: "ADHD",
    independenceGoal: "Develop independent morning skills",
    skillFocus: ["Self-care","Task initiation","Focus building"],
    difficultyLevel: "Beginner",
    activities: [
      { activityName: "Wake Up with Alarm", category: "Routine", duration: 2, order: 1 },
      { activityName: "Brush Teeth", category: "Self Care", duration: 3, order: 2 },
      { activityName: "Wash Face", category: "Self Care", duration: 2, order: 3 },
      { activityName: "Get Dressed", category: "Self Care", duration: 5, order: 4 },
      { activityName: "Eat Breakfast", category: "Health", duration: 10, order: 5 }
    ]
  });

  const autismTemplate = new RoutineTemplate({
    title: "Autism Morning Routine",
    conditionType: "AUTISM",
    independenceGoal: "Structured morning independence",
    skillFocus: ["Self-care","Routine adherence","Task sequencing"],
    difficultyLevel: "Beginner",
    activities: [
      { activityName: "Wake Up with Alarm", category: "Routine", duration: 2, order: 1 },
      { activityName: "Brush Teeth", category: "Self Care", duration: 3, order: 2 },
      { activityName: "Wash Face", category: "Self Care", duration: 2, order: 3 },
      { activityName: "Get Dressed", category: "Self Care", duration: 5, order: 4 },
      { activityName: "Eat Breakfast", category: "Health", duration: 10, order: 5 }
    ]
  });

  const child1 = new Child({ name: "John", conditionType: "ADHD" });
  const child2 = new Child({ name: "Emma", conditionType: "AUTISM" });

  await RoutineTemplate.insertMany([adhdTemplate, autismTemplate]);
  await Child.insertMany([child1, child2]);

  console.log("✅ Seed complete");
  mongoose.disconnect();
}

seed();