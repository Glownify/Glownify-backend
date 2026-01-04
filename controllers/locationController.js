import Salon from "../models/Salon.js";

export const addOrUpdateSalonLocation = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { address, city, state, zipCode, country, latitude, longitude } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: "Salon not found" });
    }

    // Parse numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, message: "Invalid latitude or longitude" });
    }

    salon.location = {
      type: 'Point',
      coordinates: [lon, lat], // [longitude, latitude] !!!
      address,
      city,
      state,
      pincode: zipCode,
      country,
    };

    await salon.save();

    res.status(200).json({
      success: true,
      message: "Location saved successfully",
      salon,
    });
  } catch (err) {
    console.error("Error saving location:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
