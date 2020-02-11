const Koa = require("koa");
const Router = require("koa-router");

/**
 * RendevousServer
 *
 */
class RendevousServer {
  constructor(port) {
    this.port = port;
    this.users = [];

    this.app = new Koa();
    this.router = new Router();

    // Setup routes
    this.router.get("/:secret_key/:ip/:port", this._handleNewPeer.bind(this));
    this.router.get("/get/:secret_key", this._handleGetPeer.bind(this));

    // Use middleware
    this.app.use(this.router.allowedMethods());
    this.app.use(this.router.routes());
    this.app.use(require("koa-body")());
  }

  /**
   * @public
   *
   * @description Start the server
   */
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Rendevous server listening on port ${this.port}`);
    });
  }

  /**
   * @private
   *
   * @description Handle a new peer connection and store the user's data
   */
  _handleNewPeer(req) {
    const { ip, port, secret_key } = req.params;

    const user = { ip, port };

    this.users[secret_key] = user;

    req.body = { result: "success" };
  }

  /**
   * @private
   *
   * @description Handle a request from a peer for another peer's information
   */
  _handleGetPeer(req) {
    const { secret_key } = req.params;
    if (this.users[secret_key]) {
      const user = this.users[secret_key];
      console.log("User data shared");
      req.body = { result: user };
    } else {
      console.log("User doesn't exist");
      req.body = { result: "Access denied" };
    }
  }
}

module.exports = RendevousServer;
