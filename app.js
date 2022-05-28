import express from "express";
const app = express();
app.use(express.json());
import "./EventListenerService/EthereumEvents.js"
import "./EventListenerService/BinanceSmartChainEvents.js";

process.on("uncaughtException", function (err) {
  //Added this just for testing
  console.log(err);
});

app.listen(5000, () => {
  console.log("Listening to port 5000");
});
