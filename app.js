const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve your static files
app.use(express.static(__dirname));

// Catch all routes (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`VoiceBridge running on port ${PORT}`);
});
