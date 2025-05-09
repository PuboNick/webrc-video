import { sleep, waitFor } from 'pubo-utils';
import { WebRtcConsumer } from './consumer/webrtc';
import { ProducerState, RtpConsumerState, WebrtcConsumerState, getRouter } from './state';
import { RtpConsumer } from './consumer/rtp';
import { getProducer } from './configure';

export class WebrtcFactory {
  private static cache: any = {};

  private static addConsumer(url) {
    if (!this.cache[url]) {
      this.cache[url] = 1;
    } else {
      this.cache[url] += 1;
    }
  }

  private static async removeConsumer(url) {
    await sleep(5000);
    if (!this.cache[url]) {
      return false;
    }

    this.cache[url] -= 1;

    if (this.cache[url] > 0) {
      return false;
    }

    delete this.cache[url];
    await ProducerState.getState(url)?.destroy();
    return true;
  }

  public static async createProducer(url, type = 'video') {
    if (!ProducerState.getState(url)) {
      const Producer = getProducer(type === 'audio' ? 'audio' : 'ffmpeg');
      console.log('create producer', url);
      const instance = new Producer({ url });
      ProducerState.setState(url, instance);
      await instance.createProducer();
    } else if (ProducerState.getState(url).loading) {
      await waitFor(async () => !ProducerState.getState(url).loading, { checkTime: 500, timeout: 10000 });
    }

    const router = await getRouter();
    await waitFor(
      async () =>
        router.canConsume({
          producerId: ProducerState.getState(url).producer.id,
          rtpCapabilities: router.rtpCapabilities,
        }),
      { checkTime: 100, timeout: 10000 },
    );
    return ProducerState.getState(url).producer;
  }

  public static async createTransport(host) {
    const instance = new WebRtcConsumer();
    WebrtcConsumerState.setState(instance.id, instance);
    return instance.createTransport(host);
  }

  public static async createConsumer({ rtpCapabilities, url, id, type = 'video' }) {
    const webrtc = WebrtcConsumerState.getState(id);

    if (!webrtc) {
      return false;
    }

    webrtc.url = url;
    const producer = await this.createProducer(url, type);
    this.addConsumer(url);

    return webrtc.createConsumer({ rtpCapabilities, producer });
  }

  public static async connect({ id, dtlsParameters }) {
    const webrtc = WebrtcConsumerState.getState(id);

    if (!webrtc) {
      return false;
    }

    return webrtc.connect(dtlsParameters);
  }

  public static async resume(id) {
    const webrtc = WebrtcConsumerState.getState(id);

    if (!webrtc) {
      return false;
    }
    await webrtc.consumer.resume();
    return { success: true };
  }

  public static removeWebrtc(id) {
    const webrtc = WebrtcConsumerState.getState(id);

    if (!webrtc) {
      return false;
    }

    this.removeConsumer(webrtc.url);
    webrtc.destroy();
    return true;
  }

  public static async createRtpConsumer({ url, ip, port, host }) {
    const instance = new RtpConsumer();
    RtpConsumerState.setState(instance.id, instance);
    const producer = await this.createProducer(url, 'video');
    this.addConsumer(url);
    return instance.create({ ip, port, producer, url, host });
  }

  public static removeRtpConsumer(id) {
    const rtp = RtpConsumerState.getState(id);
    if (!rtp) {
      return false;
    }

    this.removeConsumer(rtp.url);
    rtp.destroy();
    return true;
  }
}
