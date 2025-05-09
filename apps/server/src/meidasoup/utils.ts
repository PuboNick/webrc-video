import { Emitter } from 'pubo-utils';

export class SingleState<T> {
  private readonly cache: any = {};

  public emitter = new Emitter();

  getState(id?: string): T | undefined {
    if (!id) {
      return this.cache;
    }
    return this.cache[id];
  }

  setState(id: string, state: any) {
    this.cache[id] = state;
  }

  remove(id) {
    delete this.cache[id];
    this.emitter.emit('remove');
  }
}
