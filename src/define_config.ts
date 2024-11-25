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

import type { ConfigProvider } from './types.js'

import type { SESTransport } from './transports/ses.js'
import type { SMTPTransport } from './transports/smtp.js'
import type { BrevoTransport } from './transports/brevo.js'
import type { ResendTransport } from './transports/resend.js'
import type { MailgunTransport } from './transports/mailgun.js'
import type { SparkPostTransport } from './transports/sparkpost.js'
import type {
  SESConfig,
  SMTPConfig,
  BrevoConfig,
  MailerConfig,
  ResendConfig,
  MailgunConfig,
  SparkPostConfig,
  MailManagerTransportFactory,
} from './types.js'

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

/**
 * Config helpers to create a reference for inbuilt
 * mail transports
 */
export const transports: {
  smtp: (config: SMTPConfig) => ConfigProvider<() => SMTPTransport>
  ses: (config: SESConfig) => ConfigProvider<() => SESTransport>
  mailgun: (config: MailgunConfig) => ConfigProvider<() => MailgunTransport>
  sparkpost: (config: SparkPostConfig) => ConfigProvider<() => SparkPostTransport>
  resend: (config: ResendConfig) => ConfigProvider<() => ResendTransport>
  brevo: (config: BrevoConfig) => ConfigProvider<() => BrevoTransport>
} = {
  smtp(config) {
    return configProvider.create(async () => {
      const { SMTPTransport } = await import('./transports/smtp.js')
      return () => new SMTPTransport(config)
    })
  },
  ses(config) {
    return configProvider.create(async () => {
      const { SESTransport } = await import('./transports/ses.js')
      return () => new SESTransport(config)
    })
  },
  mailgun(config) {
    return configProvider.create(async () => {
      const { MailgunTransport } = await import('./transports/mailgun.js')
      return () => new MailgunTransport(config)
    })
  },
  sparkpost(config) {
    return configProvider.create(async () => {
      const { SparkPostTransport } = await import('./transports/sparkpost.js')
      return () => new SparkPostTransport(config)
    })
  },
  resend(config) {
    return configProvider.create(async () => {
      const { ResendTransport } = await import('./transports/resend.js')
      return () => new ResendTransport(config)
    })
  },
  brevo(config) {
    return configProvider.create(async () => {
      const { BrevoTransport } = await import('./transports/brevo.js')
      return () => new BrevoTransport(config)
    })
  },
}
