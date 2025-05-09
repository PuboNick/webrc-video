import expressWs from 'express-ws';
import { WebrtcFactory } from 'src/meidasoup';
import { ProducerState, WebrtcConsumerState } from 'src/meidasoup/state';

const encode = (obj) => {
  return Buffer.from(JSON.stringify(obj));
};

const decode = (data: any) => {
  const json = Buffer.from(data).toString();
  return JSON.parse(json);
};

const handleMessage = async (msg) => {
  let data: any;
  try {
    data = decode(msg);
  } catch (err) {
    console.log(err);
    return false;
  }

  if (data?.type && typeof WebrtcFactory[data.type] === 'function') {
    try {
      const payload = await WebrtcFactory[data.type](data.payload);
      if (!payload) {
        return false;
      }
      return { type: data.type, payload };
    } catch (err) {
      console.log(err);
    }
  }
  return false;
};

export const useWebsocket = (app) => {
  expressWs(app);

  app.ws('/webrtc', async (ws, req) => {
    ws.on('message', async function (msg) {
      const data = await handleMessage(msg);
      if (data) {
        ws.send(encode(data));
      }
    });

    const res = await WebrtcFactory.createTransport(req.query.host);
    ws.send(encode({ type: 'init', payload: res }));

    const id = ProducerState.emitter.on('remove', () => {
      if (!WebrtcConsumerState.getState(res.id)?.url) {
        return;
      }
      const producer = ProducerState.getState(WebrtcConsumerState.getState(res.id)?.url);

      console.log('webrtc send reconnect');
      if (!producer) {
        ws.send(encode({ type: 'reconnect', payload: { msg: 'producer restart.' } }));
      }
    });

    ws.on('close', () => {
      ProducerState.emitter.cancel(id);
      WebrtcFactory.removeWebrtc(res.id);
    });
  });

  app.ws('/rtp', async (ws) => {
    let rtp: any;
    ws.on('message', async function (msg) {
      const data: any = await handleMessage(msg);
      if (data?.payload) {
        rtp = data.payload;
        ws.send(encode(data));
      }
    });

    ws.on('close', () => {
      if (rtp?.id) {
        WebrtcFactory.removeRtpConsumer(rtp.id);
      }
    });
  });
};
