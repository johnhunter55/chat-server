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

function broadcast(message, senderSocket) {
  clients.forEach((client) => {
    if (client.socket !== senderSocket) {
      client.socket.write(message);
    }
  });
}

const server = net.createServer((socket) => {
  const clientId = `Client${userId++}`;
  clients.push({ id: clientId, socket });

  socket.write("Welcome to the server! :D\n");

  broadcast(`${clientId} has connected dont bully.\n`, socket);

  logToFile(`${clientId} connected.`);

  socket.on("data", (data) => {
    const message = data.toString().trim();
    if (message) {
      broadcast(`${clientId}: ${message}\n`, socket);

      logToFile(`${clientId}: ${message}`);
    }
  });
  socket.on("end", () => {
    handleDisconnect(socket, clientId);
  });

  socket.on("error", () => {
    handleDisconnect(socket, clientId);
  });
});
