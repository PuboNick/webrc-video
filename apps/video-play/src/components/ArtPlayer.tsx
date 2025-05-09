import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';

export const ArtPlayerComponent = ({ options }: any) => {
  const ref: any = useRef();

  useEffect(() => {
    const player = new Artplayer({
      container: ref.current,
      muted: true,
      ...options,
    });

    player.on('ready', () => {
      console.log('done');
      player.play();
    });

    return () => {
      player.destroy();
    };
  }, []);

  return <div ref={ref} style={{ height: '100%', width: '100%' }}></div>;
};
