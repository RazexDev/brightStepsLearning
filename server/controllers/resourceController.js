const Resource = require("../models/Resource");
const cloudinary = require("../config/cloudinary");

async function uploadFileToCloudinary(file) {
  if (!file) {
    return "";
  }
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
  return result.secure_url;
}

exports.uploadResource = async (req, res) => {
  try {
    const { title, type, instructionalText, targetSkill, studentName, requiredLevel, offlineInstructions } = req.body;
    
    let fileUrl = req.body.fileUrl || "";

    if (req.file) {
      fileUrl = await uploadFileToCloudinary(req.file);
    }

    const newResource = new Resource({ 
      title, 
      type, 
      fileUrl, 
      instructionalText, 
      targetSkill: targetSkill || "general", 
      studentName, 
      requiredLevel: requiredLevel || 0, 
      offlineInstructions 
    });
    
    await newResource.save();
    res.status(201).json({ success: true, message: "Resource uploaded successfully", data: newResource });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
