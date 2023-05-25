import http, { Server } from 'http'
import https from 'https'
import { Duplex } from 'stream'
import mustache from 'mustache'
import WebSocket from 'ws'
import fs from 'fs/promises'
import Config from './config'

export default class HttpForwardingServer {
  config: Config
  wss: WebSocket.Server<WebSocket.WebSocket>
  app: (req: http.IncomingMessage, res: http.ServerResponse) => void

  constructor(webSocketServer: WebSocket.Server, config: Config) {
    this.config = config
    this.wss = webSocketServer
    this.app = this.handleRequest.bind(this)
  }

  async start() {
    this.startHttpServer(this.config, this.app)
    if (this.config.useHttps) await this.startHttpsServer(this.config, this.app)
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

  async startHttpsServer(
    config: Config,
    app: (req: http.IncomingMessage, res: http.ServerResponse) => void,
  ) {
    if (!config.ssl) throw Error('https enabled but missing ssl config')
    const options = {
      key: await fs.readFile(config.ssl.keyPath),
      cert: await fs.readFile(config.ssl.certPath),
    }
    const server = https.createServer(options, app)
    this.startListening(server, config).then(() => {
      console.log(`HTTPS server listening on port ${config.port}`)
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
    fs.readFile('public/index.html', 'utf8')
      .then(template => {
        const renderedTemplate = mustache.render(template, {
          burnRate: this.config.desiredBurnRatePerDay,
          tokenRate: this.config.desiredBurnRatePerDay * 50000,
        })
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(renderedTemplate)
      })
      .catch(err => {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Internal Server Error')
      })
  }
}
