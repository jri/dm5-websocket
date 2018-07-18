import dm5 from 'dm5'

const IDLE_INTERVAL = 60 * 1000  // 60s

const config = dm5.restClient.getWebsocketConfig()

/**
 * A WebSocket connection to the DM5 server.
 *
 * The URL to connect to is determined automatically, based on the server-side `dm4.websockets.url` config property.
 * WebSocket messages are expected to be JSON. Serialization/Deserialization performs automatically.
 *
 * Properties:
 *   `url` - url of the WebSocket server
 *   `ws`  - the native WebSocket object
 */
export default class DM5WebSocket {

  /**
   * @param   pluginUri
   *              the URI of the calling plugin.
   * @param   dispatch
   *              the function that processes incoming messages.
   *              One argument is passed: the message pushed by the server (a deserialzed JSON object).
   */
  constructor (pluginUri, dispatch) {
    this.pluginUri = pluginUri
    this.dispatch = dispatch
    config.then(config => {
      this.url = config['dm4.websockets.url']
      console.log('[DM5] CONFIG: the WebSocket server is reachable at', this.url)
      this._create()
      this._keepAlive()
    })
  }

  /**
   * Sends a message to the server.
   *
   * @param   message   the message to be sent (arbitrary type). Will be serialized as JSON.
   */
  send (message) {
    this.ws.send(JSON.stringify(message))
  }

  _create () {
    this.ws = new WebSocket(this.url, this.pluginUri)
    this.ws.onopen = e => {
      console.log('[DM5] Opening WebSocket connection to', e.target.url)
    }
    this.ws.onmessage = e => {
      const message = JSON.parse(e.data)
      console.log('[DM5] Message received', message)
      this.dispatch(message)
    }
    this.ws.onclose = e => {
      console.log(`[DM5] Closing WebSocket connection (${e.reason})`)
      clearInterval(this.idleId)
      //
      // auto-reconnect (disabled)
      // console.log(`[DM5] Closing WebSocket connection (${e.reason}), reopening ...`)
      // setTimeout(this._create.bind(this), 1000)
    }
  }

  _keepAlive () {
    this.idleId = setInterval(this._idle.bind(this), IDLE_INTERVAL)
  }

  _idle () {
    console.log('idle connection')
    this.send({type: 'idle'})
  }
}
