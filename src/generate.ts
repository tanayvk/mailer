import { defineConfig } from './define_config.js'
import { MailerConfig, MailManagerTransportFactory, ConfigProvider } from './types.js'
import { MailManager } from './mail_manager.js'

import { Constructor, Listener } from './emitter_type.js'

export class Emitter<EventsList extends Record<string | symbol | number, any>> {
  on<Event extends Constructor<any>>(
    event: Event,
    listener: Listener<InstanceType<Event>, any>
  ): void
  on<Name extends keyof EventsList>(event: Name, listener: Listener<EventsList[Name], any>): void
  on(_event: any, _listener: Listener<any, any>): void {
    // do nothing
  }

  off<Event extends Constructor<any>>(
    event: Event,
    listener: Listener<InstanceType<Event>, any>
  ): void
  off<Name extends keyof EventsList>(event: Name, listener: Listener<EventsList[Name], any>): void
  off(_event: any, _listener: Listener<any, any>): void {
    // do nothing
  }

  async emit<Event extends Constructor<any>>(event: Event, data: InstanceType<Event>): Promise<void>
  async emit<Name extends keyof EventsList>(event: Name, data: EventsList[Name]): Promise<void>
  async emit(_event: any, _data: any): Promise<void> {
    // do nothing
  }

  async emitSerial<Event extends Constructor<any>>(
    event: Event,
    data: InstanceType<Event>
  ): Promise<void>
  async emitSerial<Name extends keyof EventsList>(
    event: Name,
    data: EventsList[Name]
  ): Promise<void>
  async emitSerial(_event: any, _data: any): Promise<void> {
    // do nothing
  }

  listenerCount(_event?: keyof EventsList | Constructor<any>): number {
    return 0
  }

  hasListeners(_event?: keyof EventsList | Constructor<any>): boolean {
    return false
  }
}
const generateMailer = async (
  config: MailerConfig & {
    default?: string | undefined
    mailers: {
      [x: string]: MailManagerTransportFactory | ConfigProvider<MailManagerTransportFactory>
    }
  }
) => new MailManager(new Emitter(), await defineConfig(config).resolver(null))

export { generateMailer }
