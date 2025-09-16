
type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;

class EventEmitter<T extends EventMap> {
  private listeners: { [K in keyof T]?: Array<(p: T[K]) => void> } = {};

  on<K extends EventKey<T>>(key: K, fn: (p: T[K]) => void) {
    this.listeners[key] = (this.listeners[key] || []).concat(fn);
  }

  off<K extends EventKey<T>>(key: K, fn: (p: T[K]) => void) {
    this.listeners[key] = (this.listeners[key] || []).filter(f => f !== fn);
  }

  emit<K extends EventKey<T>>(key: K, data?: T[K]) {
    (this.listeners[key] || []).forEach(fn => {
      fn(data!);
    });
  }
}

type AppEvents = {
  refreshPublicPage: void;
  'refresh-start': void;
  'refresh-end': void;
};

export const events = new EventEmitter<AppEvents>();
