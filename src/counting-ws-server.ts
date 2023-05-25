import WebSocket from 'ws'
import Config from './config'
import { EmbeddedPost } from './embedding-firehose-server'

export default class CountingWebsocketServer {
  protected server: WebSocket.Server
  protected clientCount: number
  protected eventCount: number

  constructor(config: Config) {
    this.clientCount = 0
    this.eventCount = 0
    this.server = new WebSocket.Server({ port: config.wssPort }, () => {
      this.initialize()
      console.log(`WSS listening on port ${config.wssPort}`)
    })
  }

  private initialize() {
    this.server.on('connection', (socket: WebSocket) => {
      this.clientCount++
      console.log(
        `Client connected. counts: {clients: ${this.clientCount}, events: ${this.eventCount}}`,
      )

      socket.on('close', () => {
        this.clientCount--
        console.log(
          `Client disconnected. counts: {clients: ${this.clientCount}, events: ${this.eventCount}}`,
        )
      })
    })
  }

  public async broadcastEventAsync(event: Promise<EmbeddedPost>) {
    const data = JSON.stringify(await event)
    this.server.clients.forEach(client => client.send(data))
    this.eventCount++
  }

  public numClients(): number {
    return this.clientCount
  }

  public numEvents(): number {
    return this.eventCount
  }

  public getWss(): WebSocket.Server<WebSocket.WebSocket> {
    return this.server
  }
}
