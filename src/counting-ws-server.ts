import WebSocket from 'ws'
import Config from './config'

export default class CountingWebsocketServer {
  protected server: WebSocket.Server
  protected clientCount: number

  constructor(config: Config) {
    this.server = new WebSocket.Server({ port: config.port })
    this.clientCount = 0

    this.initialize()
  }

  private initialize() {
    this.server.on('connection', (socket: WebSocket) => {
      this.clientCount++
      console.log(`Client connected. Total clients: ${this.clientCount}`)

      socket.on('close', () => {
        this.clientCount--
        console.log(`Client disconnected. Total clients: ${this.clientCount}`)
      })
    })
  }

  public async broadcastEventAsync(event: Promise<string>) {
    console.debug('broadcastEventAsync', event)
    this.server.emit(await event)
  }

  public numClients(): number {
    return this.clientCount
  }
}
