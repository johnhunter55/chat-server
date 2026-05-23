const net = require("net");
const readline = require("readline");

const PORT = 3000;
const HOST = "127.0.0.1";

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log("connected");
});

client.on("data", (data) => {
  console.log(data.toString().trim());
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (input) => {
  client.write(input);
});

client.on("close", () => {
  console.log("Connection to server closed.");
  process.exit();
});
