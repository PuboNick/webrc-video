import Speaker from 'speaker';
import { SyncQueue, WatchDog } from 'pubo-utils';

export class YKAudioSpeaker {
  private static _instance: YKAudioSpeaker | null = null;
  public static get instance() {
    if (!this._instance) {
      this._instance = new YKAudioSpeaker();
    }
    return this._instance;
  }

  options = { channels: 1, bitDepth: 16, sampleRate: 48000 };
  speaker: Speaker | null = null;
  dog = new WatchDog({
    limit: 10,
    onTimeout: () => {
      this.speaker.destroy();
      this.speaker = null;
    },
  });
  queue = new SyncQueue();

  async _play(buffer) {
    if (!this.speaker) {
      this.speaker = new Speaker(this.options);
    }
    this.speaker.write(buffer);
    this.dog.feed();
  }

  async play(buffer) {
    return this.queue.push(() => this._play(buffer));
  }
}
