import WebSocket from 'ws'
import Config from './config'

export default class CountingWebsocketServer {
  protected server: WebSocket.Server
  protected clientCount: number
  protected eventCount: number

  constructor(config: Config) {
    this.clientCount = 0
    this.eventCount = 0
    this.server = new WebSocket.Server({ port: config.port }, () => {
      this.initialize()
      console.log(`listening on port ${config.port}`)
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

  public async broadcastEventAsync(event: Promise<string>) {
    this.server.emit(await event)
    this.eventCount++
  }

  public numClients(): number {
    return this.clientCount
  }

  public numEvents(): number {
    return this.eventCount
  }
}
