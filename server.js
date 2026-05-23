const net = require("net");
const fs = require("fs");

const PORT = 3000;
let userId = 1;
const clients = [];

const adminPassword = "5";

function logging(message) {
  const time = new Date().toISOString();
  const logMessage = `[${time}] ${message}\n`;

  fs.appendFile("server.log", logMessage, (err) => {
    if (err) console.error("Failed to write to server.log:", err);
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
  const clientObj = { id: `Client${userId++}`, socket };
  clients.push(clientObj);

  socket.write("Welcome to the server! :D\n");
  broadcast(`${clientObj.id} has connected dont bully.\n`, socket);
  logging(`${clientObj.id} connected.`);

  socket.on("data", (data) => {
    const message = data.toString().trim();
    if (!message) return;

    if (message.startsWith("/")) {
      const parts = message.split(" ");
      const command = parts[0].toLowerCase();

      switch (command) {
        case "/w": {
          if (parts.length < 3) {
            socket.write(
              "Error: /w requires a username and a message (e.g., /w Client2 Hi!).\n",
            );
            logging(`Error: ${clientObj.id} provided incorrect /w inputs.`);
            break;
          }
          const targetUser = parts[1];
          const whisperMsg = parts.slice(2).join(" ");

          if (targetUser === clientObj.id) {
            socket.write("Error: You cannot whisper to yourself.\n");
            logging(`Error: ${clientObj.id} tried to whisper themselves.`);
            break;
          }

          const targetClient = clients.find((c) => c.id === targetUser);
          if (!targetClient) {
            socket.write(`Error: User '${targetUser}' not found.\n`);
            logging(
              `Error: ${clientObj.id} tried to whisper non-existent user '${targetUser}'.`,
            );
            break;
          }

          targetClient.socket.write(
            `[Whisper from ${clientObj.id}]: ${whisperMsg}\n`,
          );
          logging(`${clientObj.id} whispered ${targetUser}: ${whisperMsg}`);
          break;
        }

        case "/username": {
          if (parts.length !== 2) {
            socket.write(
              "Error: /username requires exactly one new username (e.g., /username John).\n",
            );
            logging(
              `Error: ${clientObj.id} provided incorrect /username inputs.`,
            );
            break;
          }
          const newName = parts[1];

          if (newName === clientObj.id) {
            socket.write("Error: Your username is already that.\n");
            logging(
              `Error: ${clientObj.id} tried to change username to their current username.`,
            );
            break;
          }

          if (clients.some((c) => c.id === newName)) {
            socket.write(`Error: Username '${newName}' is already in use.\n`);
            logging(
              `Error: ${clientObj.id} tried to use existing username '${newName}'.`,
            );
            break;
          }

          const oldName = clientObj.id;
          clientObj.id = newName;
          socket.write(`Success: Your username is now ${newName}.\n`);
          broadcast(
            `${oldName} changed their username to ${newName}.\n`,
            socket,
          );
          logging(`${oldName} changed username to ${newName}.`);
          break;
        }

        case "/kick": {
          if (parts.length !== 3) {
            socket.write(
              "Error: /kick requires a username and a password (e.g., /kick Client2 supersecretpw).\n",
            );
            logging(`Error: ${clientObj.id} provided incorrect /kick inputs.`);
            break;
          }
          const targetUser = parts[1];
          const passwordAttempt = parts[2];

          if (passwordAttempt !== adminPassword) {
            socket.write("Error: Incorrect admin password.\n");
            logging(
              `Error: ${clientObj.id} failed /kick (incorrect password).`,
            );
            break;
          }

          if (targetUser === clientObj.id) {
            socket.write("Error: You cannot kick yourself.\n");
            logging(`Error: ${clientObj.id} tried to kick themselves.`);
            break;
          }

          const targetClient = clients.find((c) => c.id === targetUser);
          if (!targetClient) {
            socket.write(`Error: User '${targetUser}' not found.\n`);
            logging(
              `Error: ${clientObj.id} tried to kick non-existent user '${targetUser}'.`,
            );
            break;
          }

          targetClient.socket.write(
            "You have been kicked from the server by an admin.\n",
          );
          broadcast(
            `${targetUser} was kicked from the chat.\n`,
            targetClient.socket,
          );
          logging(`${targetUser} was kicked by ${clientObj.id}.`);

          const index = clients.findIndex(
            (c) => c.socket === targetClient.socket,
          );
          if (index !== -1) clients.splice(index, 1);
          targetClient.socket.destroy();
          break;
        }

        case "/clientlist": {
          const names = clients.map((c) => c.id).join(", ");
          socket.write(`Connected clients: ${names}\n`);
          logging(`${clientObj.id} requested the client list.`);
          break;
        }

        default:
          socket.write("Error: Unknown command.\n");
          logging(
            `Error: ${clientObj.id} attempted unknown command: ${command}`,
          );
          break;
      }
    } else {
      broadcast(`${clientObj.id}: ${message}\n`, socket);
      logging(`${clientObj.id}: ${message}`);
    }
  });

  socket.on("end", () => handleDisconnect(socket, clientObj));
  socket.on("error", () => handleDisconnect(socket, clientObj));
});

function handleDisconnect(socket, clientObj) {
  const index = clients.findIndex((c) => c.socket === socket);
  if (index !== -1) {
    clients.splice(index, 1);
    broadcast(`${clientObj.id} has disconnected. Bye! :,(\n`, null);
    loggin(`${clientObj.id} disconnected.`);
  }
}

server.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
