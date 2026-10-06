const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");

const Event = require("../models/Event");
const Registration = require("../models/Registration");

const router = express.Router();


// POST registration
router.post("/", async (req, res) => {
  let reservedEventId = null;
  let reservedTickets = 0;
  try {

    const {
      eventId,
      name,
      email,
      phone,
      tickets
    } = req.body;


    // Basic validation
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

    if (!eventId || !normalizedName || !normalizedEmail || !normalizedPhone || tickets === undefined || tickets === null) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }


    // Check event ID
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }


    // Validate tickets
    if (!Number.isInteger(tickets) || tickets < 1) {
      return res.status(400).json({
        success: false,
        message: "Tickets must be a whole number of at least one"
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }


    // Find event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }


    // Check available seats
    if (tickets > event.availableSeats) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats available"
      });
    }


    // Generate booking ID
    // Decrement with a stock condition so concurrent requests cannot oversell.
    const reservedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableSeats: { $gte: tickets } },
      { $inc: { availableSeats: -tickets } },
      { new: true }
    );
    if (!reservedEvent) {
      return res.status(409).json({ success: false, message: "Those seats were just taken. Please refresh and try again." });
    }
    reservedEventId = eventId;
    reservedTickets = tickets;

    const bookingId = "EMS-" + crypto.randomBytes(4).toString("hex").toUpperCase();


    // Create registration
    const registration = await Registration.create({
      eventId,
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      tickets,
      bookingId
    });
    reservedEventId = null;


    res.status(201).json({
      success: true,
      message: "Registration successful",
      bookingId: registration.bookingId,
      registration: registration
    });

  } catch (error) {

    console.error(error);

    // If saving the registration failed after reserving seats, return them.
    if (reservedEventId && reservedTickets > 0) {
      try {
        await Event.updateOne({ _id: reservedEventId }, { $inc: { availableSeats: reservedTickets } });
      } catch (rollbackError) {
        console.error("Seat reservation rollback failed:", rollbackError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});


module.exports = router;
