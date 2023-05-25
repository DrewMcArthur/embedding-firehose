import http from 'http'
import https from 'https'
import { Duplex } from 'stream'
import WebSocket from 'ws'
import fs from 'fs'
import Config from './config'

export default class HttpForwardingServer {
  wss: WebSocket.Server<WebSocket.WebSocket>
  constructor(webSocketServer: WebSocket.Server, config: Config) {
    this.wss = webSocketServer
    this.startHttpServer(config)
    if (config.useHttps) this.startHttpsServer(config)
  }

  startHttpServer(config: Config) {
    const port = config.port
    const server = http.createServer()

    server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head)
    })

    server.listen(port, () => {
      console.log(`HTTP server listening on port ${port}`)
    })
  }

  startHttpsServer(config: Config) {
    if (!config.ssl) throw Error('https enabled but missing ssl config')
    const port = config.port
    const options = {
      key: fs.readFileSync(config.ssl.keyPath),
      cert: fs.readFileSync(config.ssl.certPath),
    }
    const server = https.createServer(options)

    server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head)
    })

    server.listen(port, () => {
      console.log(`HTTPS server listening on port ${port}`)
    })
  }

  handleUpgrade(request: http.IncomingMessage, socket: Duplex, head: Buffer) {
    this.wss.handleUpgrade(request, socket, head, webSocket => {
      this.wss.emit('connection', webSocket, request)
    })
  }
}
