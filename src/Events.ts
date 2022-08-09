import { DBI } from "./DBI";

export class Events {
  DBI: DBI;
  handlers: Record<string, Array<(...args: any[]) => boolean>>;
  constructor(DBI: DBI) {
    this.DBI = DBI;

    this.handlers = {
      beforeInteraction: [],
      afterInteraction: [],
      beforeEvent: [],
      afterEvent: []
    }
  }
  
  async trigger(name: "beforeInteraction" | "afterInteraction" | "beforeEvent" | "afterEvent", data: any): Promise<boolean>{
    let handlers = this.handlers[name];
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      let returned = await handler(data);
      if (returned !== true) return false;
    }
    return true;
  }


  on(eventName, handler) {
    this.handlers[eventName].push(handler);
  }

  once(eventName, handler) {
    let h = (...args) => {
      this.off(eventName, h);
      handler(...args);
    };
    this.on(eventName, h);
  }

  off(eventName, handler) {
    let l = this.handlers[eventName];
    l.splice(l.indexOf(handler), 1);
  }
}