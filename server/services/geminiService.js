const { GoogleGenerativeAI } = require("@google/generative-ai");

function getSmartMockRoutine(name, type, goals = []) {
  const normalizedType = (type || "general").toLowerCase();
  const isAutism = normalizedType.includes("autism");
  const isAdhd = normalizedType.includes("adhd");

  return {
    title: `${name || "Child"}'s Balanced Day`,
    category: "custom",
    type: normalizedType || "general",
    goal: Array.isArray(goals) && goals.length
      ? goals.join(", ")
      : "Build independence and consistency",
    skills: isAutism
      ? ["Routine adherence", "Self-regulation", "Sensory balance"]
      : isAdhd
      ? ["Focus management", "Task initiation", "Independence"]
      : ["Independence", "Self-care", "Routine consistency"],
    parentNote: "Mock AI routine used because Gemini was unavailable.",
    tasks: [
      { label: "Wake up and get ready", mins: 10 },
      { label: "Brush teeth and wash face", mins: 10 },
      { label: "Eat breakfast", mins: 20 },
      { label: isAutism ? "Quiet transition time" : "Daily planner review", mins: 10 },
      { label: "School / learning time", mins: 180 },
      { label: "Lunch / meal break", mins: 30 },
      { label: "Homework / study time", mins: 45 },
      { label: "Relaxation / play time", mins: 45 },
      { label: "Dinner time", mins: 30 },
      { label: "Wind-down routine", mins: 20 },
      { label: "Bedtime", mins: 15 }
    ]
  };
}

function extractJsonObject(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No valid JSON object found in Gemini response");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

async function generateRoutine(payload = {}) {
  const {
    childName,
    childAge,
    age,
    disabilityType,
    wakeUpTime,
    schoolTime,
    afterSchoolTime,
    mealTimes,
    breakfastTime,
    lunchTime,
    dinnerTime,
    studyTime,
    bedTime,
    sleepTime,
    goals
  } = payload;

  const finalAge = childAge || age || "";
  const finalBedTime = bedTime || sleepTime || "";
  const finalGoals = Array.isArray(goals)
    ? goals
    : typeof goals === "string"
    ? goals.split(",").map((g) => g.trim()).filter(Boolean)
    : [];

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.startsWith("AIza")) {
    console.log("⚠️ Gemini key missing or invalid-looking. Using mock routine.");
    return getSmartMockRoutine(childName, disabilityType, finalGoals);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert pediatric counselor and routine specialist for children with neurodivergent support needs, especially ADHD and Autism.

Create a structured, practical, supportive daily routine for this child.

Child details:
- Name: ${childName || "Child"}
- Age: ${finalAge || "Unknown"}
- Disability/support type: ${disabilityType || "general"}
- Daily Schedule (Parent's Description): ${payload.scheduleText || "not provided"}
- Goals: ${finalGoals.length ? finalGoals.join(", ") : "independence and routine consistency"}

Requirements:
- Make the routine realistic, gentle, and child-friendly
- Consider disability-aware structure
- Include support for independence, self-care, smooth transitions, and calm regulation where relevant
- Return 6 to 10 tasks
- Every task must include a time in minutes

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "category": "morning | school | study | evening | bedtime | custom",
  "type": "adhd | autism | general | both",
  "goal": "string",
  "skills": ["string", "string"],
  "parentNote": "string",
  "tasks": [
    { "label": "string", "mins": 10 }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";

    const jsonStr = extractJsonObject(text);
    const parsed = JSON.parse(jsonStr);

    return {
      title: parsed.title || `${childName || "Child"} Routine`,
      category: parsed.category || "custom",
      type: parsed.type || (disabilityType || "general").toLowerCase(),
      goal: parsed.goal || "Build routine consistency",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      parentNote: parsed.parentNote || "",
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map((task) => ({
            label: String(task.label || "").trim(),
            mins: Number(task.mins) || 0
          })).filter((task) => task.label)
        : []
    };
  } catch (error) {
    console.error("❌ Gemini Service Error:", error.message);
    return getSmartMockRoutine(childName, disabilityType, finalGoals);
  }
}

module.exports = { generateRoutine };