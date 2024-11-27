/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export * as errors from './src/errors.js'

export { Mailer } from './src/mailer.js'
export { Message } from './src/message.js'
export { BaseMail } from './src/base_mail.js'
export { FakeMailer } from './src/fake_mailer.js'
import { MailManager } from './src/mail_manager.js'
export { MailResponse } from './src/mail_response.js'
import { defineConfig, transports } from './src/define_config.js'
export { MailManager, defineConfig, transports }

import { Constructor, Listener } from './src/emitter_type.js'
import { MailerConfig, MailManagerTransportFactory, ConfigProvider } from './src/types.js'

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
