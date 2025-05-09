import { WatchDog } from 'pubo-utils';
import * as mediasoup from 'mediasoup';
import { spawn } from 'child_process';
import { FFmpegLib, getCommandOptions, ssrc } from '../configure';
import { ProducerState, getRouter } from '../state';
import { SIGKILL } from 'pubo-node';

export class FFmpegProducer {
  public url: string;
  public producer: mediasoup.types.Producer;
  public transport: mediasoup.types.PlainTransport;
  public options: any = {};
  public destroyed = false;
  public loading = false;

  private child: any;
  private readonly dog = new WatchDog({ limit: 60, onTimeout: this.destroy.bind(this) });

  constructor({ url }) {
    this.url = url;
  }

  async createProducer() {
    this.loading = true;
    const router = await getRouter();
    this.transport = await router.createPlainTransport({ listenIp: '127.0.0.1', rtcpMux: false, comedia: true });
    this.producer = await this.transport.produce({
      kind: 'video',
      rtpParameters: {
        codecs: [{ mimeType: 'video/vp8', clockRate: 90000, payloadType: 102, rtcpFeedback: [] }],
        encodings: [{ ssrc }],
      },
    });
    this.createInstance();
    this.loading = false;
  }

  private createInstance() {
    this.options = getCommandOptions(this.url, {
      rtp: this.transport.tuple.localPort,
      rtcp: this.transport.rtcpTuple.localPort,
    });
    this.child = spawn(FFmpegLib, this.options, { detached: true, shell: true });
    this.dog?.feed();
    this.child.stderr.on('data', () => this.dog?.feed());
  }

  async kill() {
    this.dog?.stop();
    (this as any).dog = null;
    await SIGKILL(this.child.pid);
  }

  async destroy() {
    if (this.destroyed) {
      return false;
    }

    console.log(`destroy ffmpeg producer ${this.url}`);
    ProducerState.remove(this.url);
    this.destroyed = true;
    this.producer.close();
    this.transport.close();
    this.producer = null;
    this.transport = null;
    await this.kill();
    return true;
  }
}
