import * as mediasoup from 'mediasoup';
import { mediaCodecs } from './configure';
import { WebRtcConsumer } from './consumer/webrtc';
import { waitFor } from 'pubo-utils';
import { SingleState } from './utils';
import { RtpConsumer } from './consumer/rtp';

let router: mediasoup.types.Router;
let loading = false;

const init = async () => {
  const worker = await mediasoup.createWorker({ logLevel: 'debug' });
  router = await worker.createRouter({ mediaCodecs });
};

export const getRouter = async () => {
  if (!router && !loading) {
    loading = true;
    await init();
    loading = false;
  } else if (loading) {
    await waitFor(() => !loading, { checkTime: 100, timeout: 10000 });
  }
  return router;
};

export const ProducerState = new SingleState<any>();
export const WebrtcConsumerState = new SingleState<WebRtcConsumer>();
export const RtpConsumerState = new SingleState<RtpConsumer>();
