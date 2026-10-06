const mongoose = require("mongoose");
require("dotenv").config();

const Event = require("./models/Event");


const events = [

  {
    name: "Product & Engineering Summit",
    category: "Technology",
    date: "2026-10-15",
    time: "10:00 AM",
    location: "Ahmedabad Convention Centre",
    description:
      "A one-day programme for product teams and engineers, with practical sessions on shipping software, working across teams, and building for users. Doors open at 9:30 AM; refreshments are included.",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    availableSeats: 150,
    featured: true
  },


  {
    name: "Founder Friday: Ahmedabad",
    category: "Business",
    date: "2026-10-20",
    time: "11:00 AM",
    location: "GIFT City, Gandhinagar",
    description:
      "An informal afternoon for local founders and early team members. The schedule includes short founder talks, a moderated Q&A, and time to meet other people building in Gujarat. Registration is free.",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72",
    availableSeats: 100,
    featured: false
  },


  {
    name: "Clay, Coffee & Conversation",
    category: "Art",
    date: "2026-10-25",
    time: "02:00 PM",
    location: "Kala Bhavan, Vadodara",
    description:
      "A small, beginner-friendly pottery session led by a local ceramic artist. Materials and a cup of coffee are included; finished pieces can be collected after firing. Please arrive ten minutes early.",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f",
    availableSeats: 50,
    featured: false
  },


  {
    name: "Sabarmati Sessions: Live at the Riverfront",
    category: "Music",
    date: "2026-10-30",
    time: "07:00 PM",
    location: "Riverfront Event Ground, Ahmedabad",
    description:
      "An outdoor evening of live sets from independent artists based in Ahmedabad and Vadodara. Gates open at 6:00 PM. Food stalls will be available at the venue; the event runs rain or shine.",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    availableSeats: 200,
    featured: false
  }

];


async function seedDatabase() {

  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Event.deleteMany();

    await Event.insertMany(events);

    console.log("Events inserted successfully");

    await mongoose.connection.close();

  } catch (error) {

    console.error("Seeding failed:");
    console.error(error.message);

  }

}


seedDatabase();
