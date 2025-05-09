import { Buffer } from 'buffer';
import { Device } from 'mediasoup-client';
import { WebsocketClient } from 'pubo-web';

const decode = async (msg: any) => {
  const text = await msg.text();
  return JSON.parse(text);
};

const encode = (obj: any) => {
  const json = JSON.stringify(obj);
  return Buffer.from(json);
};

let _device: Device;

export class WebRTCClientConn {
  private readonly url: string;
  private readonly el: any;
  private transport: any;
  private consumer: any;
  private config: any;
  private ws: WebsocketClient;
  private loaded = false;
  private callback: any;
  private readonly baseURI: string;
  private readonly type: 'video' | 'audio';
  stream: any = null;

  constructor({
    url,
    el,
    baseURI,
    type = 'video',
  }: {
    url: string;
    el: any;
    baseURI: string;
    type?: 'video' | 'audio';
  }) {
    this.el = el;
    this.url = url;
    this.baseURI = baseURI;
    this.type = type;

    if (!_device) {
      _device = new Device();
    }
    this.ws = new WebsocketClient({ url: baseURI });
    this.ws.emitter.on('message', this.handleMessage.bind(this));
    this.ws.connect();
  }

  private async handleMessage(msg: any) {
    const data = await decode(msg);

    if (typeof (this as any)[data.type] === 'function') {
      (this as any)[data.type](data.payload);
    } else {
      console.log(data);
    }
  }

  async init(config: any) {
    if (this.loaded) {
      this.close();
    }
    this.loaded = true;
    this.config = config;

    if (!_device?.loaded) {
      await _device.load({ routerRtpCapabilities: this.config.routerRtpCapabilities });
    }

    this.transport = _device.createRecvTransport(this.config.params);
    this.transport.on('connect', async ({ dtlsParameters }: any, callback: any) => {
      this.sendMessage({
        type: 'connect',
        payload: { transportId: this.transport.id, dtlsParameters, id: this.config.id },
      });
      this.callback = callback;
    });

    this.transport.on('connectionstatechange', (data: string) => {
      if (data === 'connected') {
        this.onConnected();
      }
    });

    this.sendMessage({
      type: 'createConsumer',
      payload: {
        rtpCapabilities: _device.rtpCapabilities,
        id: this.config.id,
        url: this.url,
        type: this.type,
      },
    });
  }

  async createConsumer(consumerParameters: any) {
    this.consumer = await this.transport.consume({
      ...consumerParameters,
      appData: { peerId: '', mediaTag: 'cam-video' },
    });
  }

  connect() {
    if (typeof this.callback === 'function') {
      this.callback();
      this.callback = null;
    }
  }

  reconnect() {
    this.ws.close();
    this.ws = new WebsocketClient({ url: this.baseURI });
    this.ws.emitter.on('message', this.handleMessage.bind(this));
    this.ws.connect();
  }

  private sendMessage(data: any) {
    this.ws.send(encode(data));
  }

  private async onConnected() {
    this.stream = new MediaStream([this.consumer.track.clone()]);
    this.stream.onaddtrack = () => console.log('done');
    this.el.srcObject = this.stream;
  }

  close() {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }
    this.loaded = false;
    this.stream = null;
  }
}
