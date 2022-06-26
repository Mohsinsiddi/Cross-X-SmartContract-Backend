import express from "express";
const app = express();
app.use(express.json());
import "./EventListenerService/NFTBinanceSmartChainEvents.js";
import "./EventListenerService/NFTPolygonEvents.js";
import "./EventListenerService/NFTEthereumEvents.js";

process.on("uncaughtException", function (err) {
  //Added this just for testing
  console.log(err);
});

app.get("/isworking", (res, req) => {
  res.send(200);
});

app.listen(5000, () => {
  console.log("Bridge Service is Listening on port 5000");
});
