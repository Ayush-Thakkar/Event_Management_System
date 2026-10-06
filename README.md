# EMS — Event Management System

An Expo React Native event browser and booking flow connected to the Express API in the parent folder. The current catalogue is seeded with Ahmedabad area events.

## Run it

1. Start MongoDB and the backend from the project root: `npm start`.
2. In this folder, install packages with `npm install`.
3. Start Expo with `npm start` and open the app in an emulator or Expo Go.

Use Node.js 22.13 or newer for the selected Expo SDK.

The app uses `http://10.0.2.2:5000/api` by default on the Android emulator and `http://localhost:5000/api` on iOS simulators and web. For a physical phone, set `EXPO_PUBLIC_API_URL` to your computer's LAN address, for example `http://192.168.1.20:5000/api`, and keep the phone and computer on the same network. The backend must accept connections from that device.

The event API is `GET /events`; the booking API is `POST /registrations`. The app includes loading, empty, and error feedback, basic form validation, and a booking confirmation state.
