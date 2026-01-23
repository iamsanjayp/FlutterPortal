import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import "./config/db.js"; // IMPORTANT: this runs DB connection

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
