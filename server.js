const net = require("net");
const fs = require("fs");

const PORT = 3000;
let userId = 1;
const clients = [];

function logging(message) {
  const time = new Date().toISOString();
  const logMessage = `[${time}] ${message}\n`;

  fs.appendFile("chat.log", logMessage, (err) => {
    if (err) console.error("Failed to write to chat.log:", err);
  });
}
