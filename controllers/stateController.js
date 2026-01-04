import State from "../models/State.js";
import mongoose from "mongoose";

export const createState = async (req, res) => {
  try {
    const { name, country, code } = req.body;
    if (!name || !country) {
      return res.status(400).json({ message: "Name and country are required." });
    }
    const existingState = await State.findOne({ name: name.trim(), country: country.trim() });
    if (existingState) {
      return res.status(400).json({ message: "State already exists." });
    }
    const newState = new State({ name: name.trim(), country: country.trim(), code: code ? code.trim() : undefined });
    await newState.save();
    res.status(201).json(newState);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all states (for admin & dropdown)
export const getStates = async (req, res) => {
  try {
    const { country } = req.query; // optional: filter by country
    const filter = country ? { country } : {};
    const states = await State.find(filter).sort({ name: 1 });
    res.status(200).json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid state ID." });
    }
    const deletedState = await State.findByIdAndDelete(id);
    if (!deletedState) {
      return res.status(404).json({ message: "State not found." });
    }
    res.status(200).json({ message: "State deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};