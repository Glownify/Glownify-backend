import express from 'express';
import State from '../models/State.js';
import City from '../models/City.js';

// Create a new State

export const createState = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name) {
            return res.status(400).json({ message: "State name is required." });
        }

        // already exists check with name check like Uttar Pradesh and uttar Pradesh and Uttarpradesh is same
        if(await State.findOne({name: new RegExp(`^${name}$`, 'i')})){
            return  res.status(400).json({ message: "State with this name already exists in the country." });
        }

        const newState = new State({ name, code });
        await newState.save();
        res.status(201).json({ message: "State created successfully", state: newState });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create state", error: error.message });
    }
}

// Create a new City
export const createCity = async (req, res) => {
    try {
        const { name, state, pincode } = req.body;
        if (!name || !state ||!pincode) {
            return res.status(400).json({ message: "City name, state, and pincode are required." });
        }

        // already exists check with name check like Mumbai and mumbai and Mumbay is same
        if(await City.findOne({name: new RegExp(`^${name}$`, 'i'), state})){
            return  res.status(400).json({ message: "City with this name already exists in the state." });
        }

        // populateState
        const newCity = new City({ name, state, pincode });
        await newCity.save();
        const populatedCity = await newCity.populate('state');
        res.status(201).json({ message: "City created successfully", city: populatedCity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create city", error: error.message });
    }
}

export const getAllCities = async (req, res) => {
    try {
        const cities = await City.find().populate('state').lean();
        res.status(200).json({ cities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch cities", error: error.message });
    }
}

export const getAllStates = async (req, res) => {
    try {
        const states = await State.find().lean();
        res.status(200).json({ states });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch states", error: error.message });
    }  
}

export const getCitiesByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        if (!stateId) {
            return res.status(400).json({ message: "State ID is required." });
        }

        const cities = await City.find({ state: stateId }).populate('state').lean();
        res.status(200).json({ cities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch cities by state", error: error.message });
    }
}