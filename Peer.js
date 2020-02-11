const stun = require("stun");
const fetch = require("node-fetch");
const dgram = require("dgram");

/**
 * @description
 *  1. Starts a UDP socket and listens for connections
 *  2. Gets it's location(public ip/port) from STUN server
 *  3. Sends it's location to the Rendevous server along with it's secret key
 *  4.
 *
 */
class Peer {
  constructor(options) {
    this.name = options.name;
    this.stunPort = 19302;
    this.stunHost = "stun.l.google.com";

    this.publicIP = null;
    this.publicPort = null;
    this.secretKey = options.secretKey;
    this.rendevousURL = options.rendevousURL;

    this.peerIP = null;
    this.peerPort = null;
    this.peerSecretKey = options.peerSecretKey;

    this.serverPort = options.serverPort;
    this.serverHost = options.serverHost;
    this.server = dgram.createSocket("udp4");

    this.server.on("listening", this._handleListening.bind(this));
    this.server.on("message", (msg, rinfo) => console.log(msg));
    this.server.bind({
      addres: this.serverHost,
      port: this.serverHost
    });
  }

  _handleListening() {
    console.log(
      `${this.name} listening for UDP connections on ${this.serverHost}:${this.serverPort}`
    );
  }

  _handleMessage(message, remote) {
    console.log(
      `${remote.address}:${remote.port} sent ${message} to ${this.name}`
    );
  }

  /**
   * @private
   *
   * @description Send a request to the STUN server to get our public address & port
   */
  _stunConnect() {
    return new Promise((resolve, reject) => {
      const client = stun.connect(this.stunPort, this.stunHost);

      client.request(() =>
        console.log("Requesting UDP packet from STUN server")
      );

      client.on("response", packet => {
        this.publicIP = packet.attrs["32"].address;
        this.publicPort = packet.attrs["32"].port;

        console.log(`${this.name}'s public IP: ${this.publicIP}`);
        console.log(`${this.name}'s public Port: ${this.publicPort}`);
        resolve();
      });
    });
  }

  /**
   * @public
   *
   * @description Establish a connection with the Rendevous server and send this peer's data
   */
  rendevous() {
    this._stunConnect().then(() => {
      console.log("Sending request to Rendevous server");

      const url = `${this.rendevousURL}/${this.secretKey}/${this.publicIP}/${this.publicPort}`;

      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw Error(res.statusText);
          }
          return res.json();
        })
        .then(json => {
          console.log("Response from stun server");
          console.log(json.result);
        })
        .catch(err => {
          console.log("Error interacting with Rendevous server.");
          console.log(err);
        });
    });
  }

  /**
   * @public
   *
   * @description Request a peer's data from the rendevous server
   */
  getPeer() {
    console.log("Request peer from Rendevous server");

    const url = `${this.rendevousURL}/get/${this.peerSecretKey}`;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw Error(res.statusText);
        }
        return res.json();
      })
      .then(json => {
        if (json.result === "Access denied") {
          console.log("Failed attempt");
        } else {
          this.peerPort = json.result.port;
          this.peerIP = json.result.ip;
        }
      })
      .catch(err => {
        console.log("Error interacting with Rendevous server.");
        console.log(err);
      });
  }

  /**
   * @public
   *
   * @description Send a message to a peer
   * @param {String} msg
   */
  sendPeerMessage(msg) {
    const msgBuffer = new Buffer(msg);
    this.server.send(
      msgBuffer,
      0,
      msgBuffer.length,
      this.peerPort,
      this.peerIP,
      (err, bytes) => {
        if (err) throw err;
        console.log(
          `${this.name} sent a message to ${this.peerIP}:${this.peerPort}`
        );
      }
    );
  }
}

module.exports = Peer;
