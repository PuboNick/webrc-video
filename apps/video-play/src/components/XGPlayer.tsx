import { Tabs } from 'antd';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Player, { I18N } from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import ZH_CN from 'xgplayer/es/lang/zh-cn';

// eslint-disable-next-line react-hooks/rules-of-hooks
I18N.use(ZH_CN);

const request = axios.create({ baseURL: `http://${window.location.hostname}:11212` });
request.interceptors.response.use((res) => res.data);

export const XGPlayer = () => {
  const ref: any = useRef();
  const cache = useMemo<any>(() => ({ player: null }), []);
  const [channels, setChannels] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>({ channel: '', video: '' });

  const init = useCallback(async () => {
    const ch: any[] = await request.get('/api/channels');
    setChannels(ch);

    if (ch.length < 1 || !ch[0].id) {
      return;
    }

    const l: any = await request.get(`/api/search?channel=${ch[0].id}`);
    if (l.length < 0) {
      return;
    }

    setList(l);
    cache.player?.setConfig({ url: `http://localhost:11212/${ch[0].id}/${l[0]}` });
    cache.player?.play();
    setCurrent({ channel: ch[0].id, video: l[0] });
  }, []);

  useEffect(() => {
    cache.player = new Player({
      autoplayMuted: true,
      el: ref.current,
      lang: 'zh-cn',
      width: 900,
      height: 600,
      videoInit: false,
    });

    return () => {
      cache.player?.destroy();
    };
  }, []);

  useEffect(() => {
    init();
  }, []);

  return (
    <div style={{ height: '600px', display: 'flex', justifyContent: 'center' }}>
      <div ref={ref} />
      <div style={{ width: 300, border: '1px solid #ccc', borderLeft: 'none' }}>
        <Tabs
          style={{ width: '100%' }}
          tabBarStyle={{ width: '100%', padding: '0 20px' }}
          onChange={async (item) => {
            setCurrent((o: any) => ({ ...o, channel: item }));
            const l: any = await request.get(`/api/search?channel=${item}`);
            if (l.length < 0) {
              return;
            }

            setList(l);
          }}
          defaultActiveKey="1"
          tabPosition="top"
          items={channels.map((item) => {
            return { label: item.name, key: item.id };
          })}
        />
        <div style={{ marginTop: -16 }}>
          {list.map((item) => (
            <div
              style={{
                padding: '5px 10px',
                cursor: 'pointer',
                background: current.video === item ? '#bbbbbc' : 'none',
              }}
              key={item}
              onClick={() => {
                setCurrent((o: any) => ({ ...o, video: item }));
                if (cache.player) {
                  cache.player.switchURL(`http://localhost:11212/${current.channel}/${item}`);
                }
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
