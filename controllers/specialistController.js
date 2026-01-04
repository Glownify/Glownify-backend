import Specialist from "../models/Specialist.js";
import Salon from "../models/Salon.js";
import User from "../models/User.js";
import crypto from "crypto";

// Secure random password (8 chars)
const generatePassword = () => crypto.randomBytes(4).toString('hex');

export const addSpecialist = async (req, res) => {
  try {
    const ownerId = req.userId; 
    const { name, phone, email, expertise, experienceYears, certifications, image, availability } = req.body;

    // Verify salon exists
    const salon = await Salon.findOne({ owner: ownerId });
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    // 2️⃣ Check if user already exists (phone/email)
    const existingUser = await User.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this phone or email already exists",
      });
    }

    // Generate secure password
    const password = generatePassword(); // use robust function with letters, digits, symbols

    const user = await User.create({
      name,
      phone,
      email,
      role: "specialist",
      password,
    });

    // Create specialist linked to salon
    const specialist = await Specialist.create({
      salon: salon._id,
      user: user._id,
      expertise,
      experienceYears: Number(experienceYears) || 0,
      certifications,
      image: image || "",
      availability: availability || [],
    });

    res.status(201).json({
      success: true,
      message: "Specialist added successfully",
      specialist,
    });
  } catch (error) {
    console.error("Error adding specialist:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding specialist",
      error: error.message,
    });
  }
};

export const getSpecialistsBySalon = async (req, res) => {
  try {
    const userId = req.userId;
    // Verify salon exists
    const salon = await Salon.findOne({ owner: userId }).populate('specialistsData').lean();
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

     const specialists = await Specialist.find({ salon: salon._id })
      .populate({
        path: "user",
        select: "name phone email role",
      })
      .sort({ createdAt: -1 })
      .lean();

   res.status(200).json({
      success: true,
      count: specialists.length,
      specialists,
    }); 
  } catch (error) {
    console.error("Error fetching specialists:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching specialists",
      error: error.message,
    });
  }
};

export const updateSpecialist = async (req, res) => {
  try {
    const { specialistId } = req.params;
    const { 
      name, phone, email, // User fields
      expertise, experienceYears, certifications, image, availability // Specialist fields
    } = req.body;

    // 1. Find the specialist record first
    const specialist = await Specialist.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({ success: false, message: "Specialist not found" });
    }

    // 2. Update the associated User record
    // We update name, phone, and email specifically
    const updatedUser = await User.findByIdAndUpdate(
      specialist.user,
      { 
        $set: { 
          ...(name && { name }), 
          ...(phone && { phone }), 
          ...(email && { email }) 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
        return res.status(404).json({ success: false, message: "Associated user not found" });
    }

    // 3. Update the Specialist record
    const updatedSpecialist = await Specialist.findByIdAndUpdate(
      specialistId,
      {
        $set: {
          expertise: expertise || specialist.expertise,
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : specialist.experienceYears,
          certifications: certifications || specialist.certifications,
          image: image || specialist.image,
          availability: availability || specialist.availability,
        },
      },
      { new: true }
    ).populate({
      path: "user",
      select: "name phone email role",
    });

    res.status(200).json({
      success: true,
      message: "Specialist updated successfully",
      specialist: updatedSpecialist,
    });
  } catch (error) {
    console.error("Error updating specialist:", error);
    
    // Handle duplicate key errors (e.g., if user tries to update to an email already in use)
    if (error.code === 11000) {
        return res.status(400).json({
            success: false,
            message: "Phone or Email already exists in the system",
        });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating specialist",
      error: error.message,
    });
  }
};

export const deleteSpecialist = async (req, res) => {
  try {
    const { specialistId } = req.params;

    const specialist = await Specialist.findById(specialistId);
    if (!specialist) {
      return res.status(404).json({ success: false, message: "Specialist not found" });
    }

    // Delete both the Specialist and the User record
    await User.findByIdAndDelete(specialist.user);
    await Specialist.findByIdAndDelete(specialistId);

    res.status(200).json({
      success: true,
      message: "Specialist and associated user account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// export const updateSpecialist = async (req, res) => {
//   try {
//     const { specialistId } = req.params;
//     const updateData = req.body;  

//     const specialist = await Specialist.findByIdAndUpdate(specialistId, updateData, { new: true }).populate("user", "name phone email").lean();
//     if (!specialist) {
//       return res.status(404).json({ success: false, message: "Specialist not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Specialist updated successfully",
//       specialist,
//     });
//   } catch (error) {
//     console.error("Error updating specialist:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating specialist",
//       error: error.message,
//     });
//   }
// };

// export const deleteSpecialist = async (req, res) => {
//   try {
//     const { specialistId } = req.params;
//     const specialist = await Specialist.findByIdAndDelete(specialistId);
//     if (!specialist) {
//       return res.status(404).json({ success: false, message: "Specialist not found" });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Specialist deleted successfully",
//       specialist,
//     });
//   }
//   catch (error) {
//     console.error("Error deleting specialist:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while deleting specialist",
//       error: error.message,
//     });
//   }
// };