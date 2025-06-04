import AppError from "../../middlewares/errorHandler.js";
import Booking from "../../models/booking.model.js";

export const createBooking = async (req, res, next) => {
  try {
    const clientInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const bookingData = {
      registrationType: req.body.registrationType,
      dateOfUsage: new Date(req.body.dateOfUsage),
      intentOfUsage: req.body.intentOfUsage,
      facilitiesRequired: req.body.facilitiesRequired,
      workspaceDuration: req.body.workspaceDuration,
      contact: {
        email: req.body.officialEmail,
        phone: req.body.phoneNumber,
      },
      submittedBy: clientInfo,
    };

    if (req.body.registrationType === 'Individual') {
      bookingData.individual = {
        fullName: req.body.fullName,
        occupationRole: req.body.occupationRole,
      };
    } else if (req.body.registrationType === 'Company') {
      bookingData.company = {
        name: req.body.companyName,
        numberOfPeople: parseInt(req.body.numberOfPeople),
        description: req.body.companyDescription,
      };
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingBooking = await Booking.findOne({
      'contact.email': bookingData.contact.email,
      submittedAt: { $gte: twentyFourHoursAgo },
      isDeleted: { $ne: true },
    });

    if (existingBooking) {
      return next(new AppError(
        'A booking request with this email was already submitted in the last 24 hours',
        409
      ));
    }

    const sameDateBookings = await Booking.countDocuments({
      dateOfUsage: bookingData.dateOfUsage,
      status: { $in: ['pending', 'approved'] },
      isDeleted: { $ne: true },
    });

    const dailyLimit = 10;
    if (sameDateBookings >= dailyLimit) {
      return next(new AppError(
        'The selected date is fully booked. Please choose another date.',
        409
      ));
    }

    const booking = new Booking(bookingData);
    await booking.save();

    console.log(`New booking submitted: ${booking._id} by ${booking.contact.email}`);

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: {
        id: booking._id,
        registrationType: booking.registrationType,
        dateOfUsage: booking.dateOfUsage,
        status: booking.status,
        submittedAt: booking.submittedAt,
      },
    });

    // Optionally send email confirmation
    // await sendConfirmationEmail(booking);

  } catch (error) {
    next(error); // Let the global error handler take over
  }
};


// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = { isDeleted: { $ne: true } };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.registrationType) filter.registrationType = req.query.registrationType;

    if (req.query.dateFrom || req.query.dateTo) {
      filter.dateOfUsage = {};
      if (req.query.dateFrom) filter.dateOfUsage.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.dateOfUsage.$lte = new Date(req.query.dateTo);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).select('-submittedBy -__v'),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings' });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).select('-submittedBy -__v');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking' });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const bookingId = req.params.id;
    const adminId = req.user?.id;

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: { $ne: true } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (status === 'approved') {
      await booking.approve(adminId, adminNotes);
    } else if (status === 'rejected') {
      await booking.reject(adminId, adminNotes);
    } else {
      booking.status = status;
      booking.processedAt = new Date();
      booking.processedBy = adminId;
      if (adminNotes) booking.adminNotes = adminNotes;
      await booking.save();
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: {
        id: booking._id,
        status: booking.status,
        processedAt: booking.processedAt,
      },
    });

    // await sendStatusUpdateEmail(booking);

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

// Soft delete booking
const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const adminId = req.user?.id;

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: { $ne: true } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await booking.softDelete(adminId);

    res.json({ success: true, message: 'Booking deleted successfully' });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const typeStats = await Booking.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$registrationType', count: { $sum: 1 } } },
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await Booking.countDocuments({
      submittedAt: { $gte: sevenDaysAgo },
      isDeleted: { $ne: true },
    });

    res.json({
      success: true,
      data: {
        statusStats: stats,
        typeStats,
        recentBookings: recentCount,
        totalBookings: await Booking.countDocuments({ isDeleted: { $ne: true } }),
      },
    });

  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve booking statistics' });
  }
};
