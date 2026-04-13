import Salon from "../models/Salon.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";






// ---- SALON OWNER DASHBOARD RELATED CONTROLLERS ---- //
export const getSalonOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // find salon of logged in owner
        const salon = await Salon.findOne({ owner: ownerId });

        if (!salon) {
        return res.status(404).json({
            success: false,
            message: "Salon not found for this owner"
        });
        }

        const salonId = salon._id;

        // today's date range
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const bookingFilter = {
            $or: [
                { providerId: salonId, providerType: "Salon" },
                { salon: salonId }
            ]
        };

        const [
        bookedToday,
        pendingBookings,
        uniqueCustomers,
        recentBookings,
        recentReviews
        ] = await Promise.all([

        // booked today
        Booking.countDocuments({
            ...bookingFilter,
            status: "confirmed",
            bookingDate: { $gte: todayStart, $lte: todayEnd }
        }),

        // pending requests
        Booking.countDocuments({
            ...bookingFilter,
            status: "pending"
        }),

        // unique customers
        Booking.distinct("customer", {
            ...bookingFilter,
            status: "confirmed"
        }),

        // recent bookings
        Booking.find(bookingFilter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("customer", "name phone")
            .select("status bookingDate customer"),

        // ✅ Correct reviews query
            Review.find({
            targetType: "Salon",
            targetId: salonId
            })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("user", "name")
            .select("rating comment user createdAt")
        ]);

        return res.status(200).json({
        success: true,
        message: "Dashboard data fetched successfully",
        data: {
            stats: {
            bookedToday,
            pendingBookings,
            totalCustomers: uniqueCustomers.length
            },
            recentBookings,
            recentReviews
        }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal Server Error"
        });
    }
};