const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");


const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);


// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Event Management API is running"
  });
});


// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {

    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on http://localhost:${process.env.PORT || 5000}`
      );
    });

  })
  .catch((error) => {

    console.error("MongoDB connection failed:");
    console.error(error.message);

  });