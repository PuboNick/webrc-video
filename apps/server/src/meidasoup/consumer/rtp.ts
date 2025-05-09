import { randomUUID } from 'crypto';
import { RtpConsumerState, getRouter } from '../state';
import { PlainTransport, Consumer } from 'mediasoup/node/lib/types';

export class RtpConsumer {
  public id = randomUUID();
  public transport: PlainTransport;
  public consumer: Consumer;
  public url: string;

  async create({ port, ip = '127.0.0.1', producer, url, host }) {
    this.url = url;
    const router = await getRouter();
    const transport = await router.createPlainTransport({
      listenIp: host,
      rtcpMux: true,
    });
    this.transport = transport;
    await transport.connect({ ip, port });
    await this.consume(producer);
    return { id: this.id };
  }

  async consume(producer) {
    const router = await getRouter();

    this.consumer = await this.transport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: false,
    });
  }

  destroy() {
    if (this.consumer) {
      this.consumer.close();
    }

    if (this.transport) {
      this.transport.close();
    }

    RtpConsumerState.remove(this.id);
  }
}
