import http, { Server } from 'http'
import https from 'https'
import { Duplex } from 'stream'
import WebSocket from 'ws'
import fs from 'fs'
import Config from './config'

export default class HttpForwardingServer {
  wss: WebSocket.Server<WebSocket.WebSocket>
  constructor(webSocketServer: WebSocket.Server, config: Config) {
    this.wss = webSocketServer
    const app = this.handleRequest.bind(this)
    this.startHttpServer(config, app)
    if (config.useHttps) this.startHttpsServer(config, app)
  }

  startHttpServer(
    config: Config,
    app: (req: http.IncomingMessage, res: http.ServerResponse) => void,
  ) {
    const server = http.createServer(app)
    this.startListening(server, config).then(() => {
      console.log(`HTTP server listening on port ${config.port}`)
    })
  }

  startHttpsServer(
    config: Config,
    app: (req: http.IncomingMessage, res: http.ServerResponse) => void,
  ) {
    if (!config.ssl) throw Error('https enabled but missing ssl config')
    const port = config.port
    const options = {
      key: fs.readFileSync(config.ssl.keyPath),
      cert: fs.readFileSync(config.ssl.certPath),
    }
    const server = https.createServer(options, app)
    this.startListening(server, config).then(() => {
      console.log(`HTTPS server listening on port ${port}`)
    })
  }

  startListening(
    server: Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
    config: Config,
  ) {
    return new Promise<void>(resolve => {
      server.on('upgrade', (request, socket, head) => {
        this.handleUpgrade(request, socket, head)
      })

      server.listen(config.port, resolve)
    })
  }

  handleUpgrade(request: http.IncomingMessage, socket: Duplex, head: Buffer) {
    this.wss.handleUpgrade(request, socket, head, webSocket => {
      this.wss.emit('connection', webSocket, request)
    })
  }

  handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write('Welcome to the embedding-firehose.  ')
    res.write('Connect via WebSocket on HTTP or HTTPS.\n')
    res.write('Read more: https://github.com/drewmcarthur/embedding-firehose\n')
    res.end()
  }
}
