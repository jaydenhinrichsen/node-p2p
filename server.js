const RENDEVOUS_URL = "http://XXX.XXX.XXX.XXX:3000";

// ------------------------- Rendevous Server -------------------------
const RendevousServer = require("./RendevousServer");
const rendevousServer = new RendevousServer(3000);

rendevousServer.listen();

// ------------------------------ Peers ------------------------------
const Peer = require("./Peer");

const peer1 = new Peer({
  name: "Peer 1",
  secretKey: "123",
  peerSecretKey: "456",
  serverPort: 8000,
  serverHost: "XXX.XXX.XXX.XXX",
  rendevousURL: RENDEVOUS_URL
});
peer1.rendevous();

const peer2 = new Peer({
  name: "Peer 2",
  secretKey: "456",
  peerSecretKey: "123",
  serverPort: 8100,
  serverHost: "XXX.XXX.XXX.XXX",
  rendevousURL: RENDEVOUS_URL
});
peer2.rendevous();

setTimeout(() => {
  peer1.getPeer();
}, 1000);

setTimeout(() => {
  peer2.getPeer();
}, 2000);

setTimeout(() => {
  peer1.sendPeerMessage("Hello friend");
}, 3000);
