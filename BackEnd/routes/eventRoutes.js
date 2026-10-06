const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");

const router = express.Router();


// GET all events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events: events
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
  }
});


// GET single event
router.get("/:id", async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    res.status(200).json({
      success: true,
      event: event
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event"
    });
  }
});


module.exports = router;