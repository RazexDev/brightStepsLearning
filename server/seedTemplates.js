/**
 * server/seedTemplates.js  (full replacement)
 * Run: node server/seedTemplates.js
 * Seeds 14 disability-aware routine templates.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Template = require("./models/Template");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/brightsteps";

const templates = [

  /* ─────────────── ADHD ─────────────── */
  {
    title: "ADHD Morning Boost",
    disabilityType: "adhd",
    category: "morning",
    estimatedTime: 60,
    goals: ["smoother morning routine", "independence", "focus improvement"],
    linkedGoals: ["independence", "focus improvement"],
    skills: ["self-management", "time awareness", "sequencing"],
    notes: "Use a visual timer for each step. Lay out clothes the night before to remove decision fatigue. Celebrate getting ready without reminders!",
    tasks: [
      { label: "Wake up & do 5 big stretches in bed", mins: 5 },
      { label: "Drink a full glass of water", mins: 2 },
      { label: "Brush teeth with 2-minute timer", mins: 5 },
      { label: "Wash face & comb hair", mins: 5 },
      { label: "Get dressed (clothes prepared night before)", mins: 10 },
      { label: "Protein breakfast — eggs, yoghurt or nut butter", mins: 15 },
      { label: "Pack school bag using printed checklist", mins: 8 },
      { label: "Movement break — jumping jacks or stretch", mins: 5 },
      { label: "Review today's schedule with parent", mins: 5 }
    ]
  },
  {
    title: "ADHD After-School Recharge",
    disabilityType: "adhd",
    category: "custom",
    estimatedTime: 75,
    goals: ["emotional regulation", "calm transitions", "focus improvement"],
    linkedGoals: ["calm transitions", "emotional regulation"],
    skills: ["self-regulation", "transition management", "focus"],
    notes: "The after-school period is often the hardest for ADHD children. Allow genuine decompression before homework — rushing into work leads to meltdowns. Movement first, brain work second.",
    tasks: [
      { label: "Drop bag — change into comfy clothes", mins: 5 },
      { label: "Snack + water (no screens yet)", mins: 10 },
      { label: "Outdoor play or movement — 20 minutes minimum", mins: 20 },
      { label: "5-minute calm breathing before homework", mins: 5 },
      { label: "Homework block 1 — 20-min Pomodoro with timer", mins: 20 },
      { label: "Short break — stretch or walk around", mins: 5 },
      { label: "Homework block 2 — finish remaining work", mins: 20 },
      { label: "Pack completed homework back into bag", mins: 5 },
      { label: "Free choice activity (not screens)", mins: 15 }
    ]
  },
  {
    title: "ADHD Focus Study Session",
    disabilityType: "adhd",
    category: "study",
    estimatedTime: 70,
    goals: ["focus improvement", "school preparation", "independence"],
    linkedGoals: ["focus improvement"],
    skills: ["task initiation", "sustained attention", "organisation"],
    notes: "Pomodoro technique (20 mins on, 5 mins break) works very well for ADHD. Use a visual timer on the desk. Remove all distractions — phone in another room, noise-cancelling headphones if helpful.",
    tasks: [
      { label: "Clear desk — only study items on table", mins: 5 },
      { label: "Write today's tasks on sticky note", mins: 5 },
      { label: "Fill water bottle and place on desk", mins: 2 },
      { label: "Focus block 1 — set 20-min timer, work starts now", mins: 20 },
      { label: "Break — stand, stretch, get a snack", mins: 5 },
      { label: "Focus block 2 — 20-min timer", mins: 20 },
      { label: "Break — short walk or 5 jumping jacks", mins: 5 },
      { label: "Final review — tick off completed tasks", mins: 5 },
      { label: "Pack away and tidy desk", mins: 3 }
    ]
  },
  {
    title: "ADHD Bedtime Wind-Down",
    disabilityType: "adhd",
    category: "bedtime",
    estimatedTime: 45,
    goals: ["bedtime consistency", "emotional regulation", "self-care"],
    linkedGoals: ["bedtime consistency"],
    skills: ["self-regulation", "wind-down", "self-care"],
    notes: "Start this routine at the same time every night. Consistency is key for ADHD brains. Dim lights 30 minutes before bed. Screen-free is essential — even 'just 10 minutes' can delay sleep by an hour for ADHD children.",
    tasks: [
      { label: "Turn off all screens — no exceptions", mins: 2 },
      { label: "Tidy bedroom (10-minute timer)", mins: 10 },
      { label: "Shower or wash face and brush teeth", mins: 10 },
      { label: "Change into pyjamas", mins: 5 },
      { label: "Write 3 good things from today in a small notebook", mins: 5 },
      { label: "Prepare tomorrow's clothes and bag", mins: 5 },
      { label: "Parent reads aloud or child reads independently", mins: 10 },
      { label: "Deep breathing — 4-7-8 method × 3 rounds", mins: 5 },
      { label: "Lights off — consistent time every night", mins: 3 }
    ]
  },

  /* ─────────────── AUTISM ─────────────── */
  {
    title: "Autism Visual Morning Routine",
    disabilityType: "autism",
    category: "morning",
    estimatedTime: 65,
    goals: ["smoother morning routine", "independence", "self-care", "calm transitions"],
    linkedGoals: ["independence", "calm transitions"],
    skills: ["self-care", "following schedules", "sequencing"],
    notes: "Use a visual picture schedule placed at eye level. Give a 5-minute warning before each transition. Allow the child to move at their own pace within reason — rushing increases anxiety and reduces compliance.",
    tasks: [
      { label: "Wake up at consistent time — same every day", mins: 5 },
      { label: "Check visual schedule for today", mins: 5 },
      { label: "Toilet and hygiene — brush teeth and wash face", mins: 10 },
      { label: "Choose outfit from 2 pre-selected options", mins: 8 },
      { label: "Breakfast — preferred foods, same place daily", mins: 15 },
      { label: "Sensory regulation — fidget toy, calm corner or deep pressure", mins: 7 },
      { label: "Pack bag using picture checklist", mins: 10 },
      { label: "Goodbye ritual — consistent farewell routine", mins: 5 }
    ]
  },
  {
    title: "Autism Transition Support Routine",
    disabilityType: "autism",
    category: "custom",
    estimatedTime: 40,
    goals: ["calm transitions", "emotional regulation", "school preparation"],
    linkedGoals: ["calm transitions", "emotional regulation"],
    skills: ["transition management", "emotional regulation", "predictability"],
    notes: "Transitions are one of the hardest moments for autistic children. This routine uses first-then language, visual timers, and a favourite comfort item to smooth each transition point.",
    tasks: [
      { label: "Check first-then board for next activity", mins: 3 },
      { label: "5-minute warning — hear the timer sound", mins: 1 },
      { label: "Finish current activity at a natural stopping point", mins: 5 },
      { label: "Put away current items neatly", mins: 5 },
      { label: "Sensory regulation if needed — calm corner or squeeze toy", mins: 5 },
      { label: "Travel with comfort item if moving between places", mins: 2 },
      { label: "Arrive and check visual schedule for new environment", mins: 5 },
      { label: "Choose a preferred starter activity to settle in", mins: 10 },
      { label: "Parent check-in — thumbs up or feelings card", mins: 4 }
    ]
  },
  {
    title: "Autism Bedtime Calm Routine",
    disabilityType: "autism",
    category: "bedtime",
    estimatedTime: 55,
    goals: ["bedtime consistency", "emotional regulation", "self-care", "calm transitions"],
    linkedGoals: ["bedtime consistency", "emotional regulation"],
    skills: ["wind-down", "sensory regulation", "self-care"],
    notes: "Autistic children often struggle with sleep due to sensory sensitivity and difficulty switching off. This routine uses dim lighting, deep pressure, and consistent predictable steps to signal that sleep is coming. Weighted blankets can significantly help.",
    tasks: [
      { label: "Visual 'day is done' signal — flip the schedule card", mins: 3 },
      { label: "Dim lights in bedroom and hallway", mins: 2 },
      { label: "Bath or shower — preferred water temperature", mins: 15 },
      { label: "Put on preferred comfortable pyjamas", mins: 5 },
      { label: "Weighted blanket + 5 minutes quiet time in room", mins: 8 },
      { label: "Same bedtime social story or predictable book", mins: 10 },
      { label: "Deep pressure activity — shoulder squeeze or joint compression", mins: 5 },
      { label: "Soft background sound — nature sounds or white noise", mins: 3 },
      { label: "Lights off at exact same time every night", mins: 2 },
      { label: "Parent stays nearby until child is calm", mins: 2 }
    ]
  },
  {
    title: "Autism School Preparation Routine",
    disabilityType: "autism",
    category: "school",
    estimatedTime: 45,
    goals: ["school preparation", "calm transitions", "independence"],
    linkedGoals: ["school preparation"],
    skills: ["organisation", "predictability", "independence"],
    notes: "School can be overwhelming. This routine helps the child mentally prepare with clear visual steps, a familiar sensory warm-up, and a consistent goodbye ritual that reduces separation anxiety.",
    tasks: [
      { label: "Review visual school schedule for today's subjects", mins: 5 },
      { label: "Pack bag with picture checklist — tick each item", mins: 10 },
      { label: "Sensory prep — preferred calming input activity", mins: 8 },
      { label: "Review first-then board for the school morning", mins: 5 },
      { label: "Consistent goodbye ritual with parent — same words every day", mins: 5 },
      { label: "Travel with comfort item in bag if needed", mins: 2 },
      { label: "Arrival routine — greet teacher and find seat", mins: 5 },
      { label: "Settle with visual timer before first lesson", mins: 5 }
    ]
  },
  {
    title: "Autism Emotional Regulation Toolkit",
    disabilityType: "autism",
    category: "custom",
    estimatedTime: 30,
    goals: ["emotional regulation", "calm transitions", "self-care"],
    linkedGoals: ["emotional regulation"],
    skills: ["emotional awareness", "self-regulation", "coping strategies"],
    notes: "Use this routine whenever the child is overwhelmed or dysregulated. The calm corner should always be available and never feel like a punishment. Practice this routine during calm times so it becomes automatic during distress.",
    tasks: [
      { label: "Go to calm corner — child-led, no pressure", mins: 3 },
      { label: "Check feelings chart — point to current emotion", mins: 3 },
      { label: "Choose 1 sensory tool from toolkit", mins: 2 },
      { label: "Balloon breathing — breathe in slowly, breathe out slowly × 5", mins: 4 },
      { label: "Body scan — notice and relax each part of the body", mins: 5 },
      { label: "Preferred calming activity — drawing, puzzle, or fidget", mins: 10 },
      { label: "Check feelings chart again — is it better?", mins: 3 }
    ]
  },

  /* ─────────────── GENERAL ─────────────── */
  {
    title: "Independence Builder — Morning",
    disabilityType: "general",
    category: "morning",
    estimatedTime: 55,
    goals: ["independence", "self-care", "smoother morning routine"],
    linkedGoals: ["independence"],
    skills: ["self-management", "time management", "self-care"],
    notes: "The goal is for your child to complete this routine with fewer reminders each week. Praise effort rather than speed. After 2 weeks, try stepping back and letting them use the checklist independently.",
    tasks: [
      { label: "Wake up using own alarm — no parent needed", mins: 5 },
      { label: "Make bed before leaving bedroom", mins: 5 },
      { label: "Shower or wash and brush teeth", mins: 10 },
      { label: "Get dressed independently", mins: 8 },
      { label: "Prepare and eat breakfast", mins: 15 },
      { label: "Pack school bag from checklist", mins: 5 },
      { label: "Check weather — is outfit appropriate?", mins: 3 },
      { label: "Leave on time without reminders", mins: 4 }
    ]
  },
  {
    title: "After-School Decompression",
    disabilityType: "general",
    category: "custom",
    estimatedTime: 65,
    goals: ["independence", "emotional regulation", "focus improvement"],
    linkedGoals: ["independence"],
    skills: ["self-management", "homework habits", "responsibility"],
    notes: "Giving children genuine downtime after school before homework improves both behaviour and academic output. This routine balances free time with structured work and a household contribution.",
    tasks: [
      { label: "Arrive home — drop bag and change clothes", mins: 5 },
      { label: "Healthy snack and water", mins: 10 },
      { label: "Free outdoor play or hobby time", mins: 20 },
      { label: "Homework or reading session", mins: 20 },
      { label: "Help with one household task", mins: 10 }
    ]
  },
  {
    title: "Bedtime Independence Routine",
    disabilityType: "general",
    category: "bedtime",
    estimatedTime: 40,
    goals: ["self-care", "bedtime consistency", "independence"],
    linkedGoals: ["self-care", "independence"],
    skills: ["self-care", "wind-down", "independence"],
    notes: "This routine can be done independently by most children from age 7+. Put the checklist on the bathroom mirror. Reward completion without reminders with a small star on a chart.",
    tasks: [
      { label: "Tidy bedroom — 10-minute challenge", mins: 10 },
      { label: "Brush teeth and wash face", mins: 8 },
      { label: "Change into pyjamas", mins: 5 },
      { label: "Read for 15 minutes", mins: 15 },
      { label: "Lights off at consistent time", mins: 2 }
    ]
  },
  {
    title: "Self-Care Skills Routine",
    disabilityType: "general",
    category: "custom",
    estimatedTime: 35,
    goals: ["self-care", "independence"],
    linkedGoals: ["self-care"],
    skills: ["hygiene", "self-care", "independence"],
    notes: "Focused specifically on building personal hygiene and self-care habits. Great for children who need extra prompting in this area. Use visual reminders in the bathroom.",
    tasks: [
      { label: "Wash hands — front, back, between fingers, 20 seconds", mins: 2 },
      { label: "Brush teeth — 2 minutes, all surfaces", mins: 3 },
      { label: "Wash face properly — forehead, cheeks, chin", mins: 3 },
      { label: "Comb or brush hair", mins: 3 },
      { label: "Check appearance in mirror — is everything neat?", mins: 2 },
      { label: "Put used clothes in laundry basket", mins: 2 },
      { label: "Hang up towel after use", mins: 2 }
    ]
  },
  {
    title: "Both — Full Day Blended Support",
    disabilityType: "both",
    category: "custom",
    estimatedTime: 80,
    goals: ["independence", "emotional regulation", "calm transitions", "focus improvement"],
    linkedGoals: ["independence", "calm transitions"],
    skills: ["self-regulation", "transition management", "focus", "independence"],
    notes: "Designed for children with both ADHD and Autism. Combines structure and predictability (ASD support) with movement breaks and short focus blocks (ADHD support). Keep the routine order consistent — but allow flexibility in timing when the child is regulated.",
    tasks: [
      { label: "Wake up — same alarm, same time daily", mins: 5 },
      { label: "Check picture schedule for the day", mins: 5 },
      { label: "Brush teeth + wash face (2-min visual timer)", mins: 6 },
      { label: "Dress from pre-set outfit — independent", mins: 8 },
      { label: "Breakfast — familiar, low-distraction foods", mins: 15 },
      { label: "Sensory break — deep pressure, fidget or stretching", mins: 8 },
      { label: "Pack school bag using checklist", mins: 8 },
      { label: "After school: snack and quiet decompression", mins: 20 },
      { label: "20-min homework block with visual timer", mins: 20 },
      { label: "Movement break — walk, bounce or outdoor play", mins: 15 },
      { label: "Screen-free low-stimulation evening activity", mins: 20 },
      { label: "Bedtime: dim lights, weighted blanket, consistent routine", mins: 25 }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
    await Template.deleteMany({});
    console.log("🧹 Cleared existing templates");
    const inserted = await Template.insertMany(templates);
    console.log(`🌱 Seeded ${inserted.length} templates`);
    await mongoose.disconnect();
    console.log("👋 Done!");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
