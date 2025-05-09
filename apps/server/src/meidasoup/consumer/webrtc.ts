import { randomUUID } from 'crypto';
import * as mediasoup from 'mediasoup';

import { WebrtcConsumerState, getRouter } from '../state';

export class WebRtcConsumer {
  public id = randomUUID();
  public transport: mediasoup.types.WebRtcTransport;
  public url: string;
  public consumer: mediasoup.types.Consumer;

  get params() {
    return {
      id: this.transport.id,
      iceParameters: this.transport.iceParameters,
      iceCandidates: this.transport.iceCandidates,
      dtlsParameters: this.transport.dtlsParameters,
    };
  }

  async createTransport(host) {
    const ip = host === 'localhost' ? '127.0.0.1' : host;
    const router = await getRouter();
    this.transport = await router.createWebRtcTransport({
      listenIps: [{ ip }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return { id: this.id, params: this.params, routerRtpCapabilities: router.rtpCapabilities };
  }

  async createConsumer({ rtpCapabilities, producer }) {
    const consumer = await this.transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: false,
    });
    this.consumer = consumer;

    return {
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      producerPaused: consumer.producerPaused,
    };
  }

  async connect(dtlsParameters) {
    await this.transport.connect({ dtlsParameters });
    return { success: true };
  }

  async resume() {
    await this.consumer.resume();
    return { success: true };
  }

  destroy() {
    if (this.transport) {
      this.transport.close();
    }
    if (this.consumer) {
      this.consumer.close();
    }
    WebrtcConsumerState.remove(this.id);
  }
}
