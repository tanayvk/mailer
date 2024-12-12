/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const configProvider = {
  create<T>(resolver: ConfigProvider<T>['resolver']): ConfigProvider<T> {
    return {
      type: 'provider',
      resolver,
    }
  },

  async resolve<T>(app: any, provider: unknown): Promise<T | null> {
    if (provider && typeof provider === 'object' && 'type' in provider) {
      return (provider as ConfigProvider<T>).resolver(app)
    }

    return null
  },
}

import type { ConfigProvider, MailerConfig, MailManagerTransportFactory } from './types.js'

/**
 * Helper to remap known mailers to factory functions
 */
type ResolvedConfig<KnownMailers extends Record<string, MailManagerTransportFactory>> =
  MailerConfig & {
    default?: keyof KnownMailers
    mailers: {
      [K in keyof KnownMailers]: KnownMailers[K] extends ConfigProvider<infer A>
      ? A
      : KnownMailers[K]
    }
  }

/**
 * Helper function to define config for the mail
 * service
 */
export function defineConfig<KnownMailers extends Record<string, MailManagerTransportFactory>>(
  config: MailerConfig & {
    default?: keyof KnownMailers
    mailers: {
      [K in keyof KnownMailers]: ConfigProvider<KnownMailers[K]> | KnownMailers[K]
    }
  }
): ConfigProvider<ResolvedConfig<KnownMailers>> {
  return configProvider.create(async (app) => {
    const { mailers, default: defaultMailer, ...rest } = config
    const mailersNames = Object.keys(mailers)
    const transports = {} as Record<string, MailManagerTransportFactory>

    for (let mailerName of mailersNames) {
      const mailerTransport = mailers[mailerName]
      if (typeof mailerTransport === 'function') {
        transports[mailerName] = mailerTransport
      } else {
        transports[mailerName] = await mailerTransport.resolver(app)
      }
    }

    return {
      default: defaultMailer,
      mailers: transports,
      ...rest,
    } as ResolvedConfig<KnownMailers>
  })
}
