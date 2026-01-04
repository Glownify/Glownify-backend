import Salon from "../models/Salon.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, price, durationInDays, features } = req.body;
    const newPlan = new SubscriptionPlan({
      name,
      price,
      durationInDays,
      features
    });

    await newPlan.save();

    res.status(201).json({ message: "Subscription plan created successfully!", plan: newPlan });
  } catch (error) {
    console.error("Error creating subscription plan:", error);
    res.status(500).json({ message: "Server error while creating subscription plan." });
  }
};

export const assignSubscription = async (req, res) => {
  try {
    const { subscriberId, planId } = req.body; 

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    const updateData = {
      subscription: {
        planId,
        startDate,
        endDate,
        paymentStatus: "paid",
      },
    };

    if (subscriberType === "salon_owner") {
      await Salon.findByIdAndUpdate(subscriberId, updateData, { new: true });
    } else {
      await IndependentProfessional.findByIdAndUpdate(subscriberId, updateData, { new: true });
    }
    res.status(200).json({ message: "Subscription assigned successfully", startDate, endDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkSubscriptionStatus = async (req, res) => {
  console.log("Checking subscription status for user:", req.userId);
  const userId = req.userId;
   try {
    const salon = await Salon.findOne({ owner: userId });
    if (!salon) return res.status(404).json({ message: "Salon not found" });

    const { subscription } = salon;

    let isSubscriptionActive = false;

    if (subscription && subscription.planId && subscription.endDate && subscription.paymentStatus === "paid") {
      isSubscriptionActive = new Date(subscription.endDate) > new Date();
    }

    res.json({
      isSubscriptionActive,
      subscription,
    });
    console.log("Subscription status response sent for user:", isSubscriptionActive, subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const subscribePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.userId;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const salon = await Salon.findOne({ owner: userId });
    if (!salon) return res.status(404).json({ message: "Salon not found" });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    salon.subscription = {
      planId,
      startDate,
      endDate,
      paymentStatus: "paid",
    };

     // ✅ Set onboardedBy ONLY at subscription time
    if (!salon.onboardedBy) {
      salon.onboardedBy = userId;
    }

    await salon.save();
    console.log("Subscription updated for salon:", salon._id);
     return res.status(200).json({
      success: true,
      message: "Subscription assigned successfully",
      startDate,
      endDate,
      onboardedBy: salon.onboardedBy,
      referredBy: salon.referredBy,
    });

  } catch (error) {
     console.error("Subscribe plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().lean();
    if(plans.length === 0 || !plans) {
      console.log("No subscription plans found.");
      return res.status(404).json({ message: "No subscription plans available." });
    }
    console.log("Fetched subscription plans:", plans);
    res.status(200).json({ plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "Server error while fetching subscription plans." });
  }
};