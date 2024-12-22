/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ofetch } from 'ofetch'
import { text } from 'node:stream/consumers'
import { ObjectBuilder } from '@poppinss/utils'
import { type Transport, createTransport } from 'nodemailer'
import MailMessage from 'nodemailer/lib/mailer/mail-message.js'

import debug from '../debug.js'
import { MailResponse } from '../mail_response.js'
import { E_MAIL_TRANSPORT_ERROR } from '../errors.js'
import type {
  SparkPostConfig,
  NodeMailerMessage,
  MailTransportContract,
  SparkPostRuntimeConfig,
  SparkPostSentMessageInfo,
} from '../types.js'

/**
 * Transport for nodemailer.
 */
class NodeMailerTransport implements Transport {
  name = 'sparkpost'
  version = '1.0.0'

  #config: SparkPostConfig

  constructor(config: SparkPostConfig) {
    this.#config = config
  }

  /**
   * Returns base url for sending emails
   */
  #getBaseUrl(): string {
    return this.#config.baseUrl.replace(/\/$/, '')
  }

  /**
   * Formatting recipients for sparkpost API call
   */
  #formatRecipients(
    recipients?: MailMessage['data']['to'] | MailMessage['data']['cc'] | MailMessage['data']['bcc']
  ): { address: { name?: string; email: string } }[] {
    if (!recipients) {
      return []
    }

    /**
     * Normalizing an array of recipients
     */
    if (Array.isArray(recipients)) {
      return recipients.map((recipient) => {
        if (typeof recipient === 'string') {
          return {
            address: { email: recipient },
          }
        }

        return {
          address: {
            email: recipient.address,
            ...(recipient.name ? { name: recipient.name } : {}),
          },
        }
      })
    }

    /**
     * Normalizing a string based recipient
     */
    if (typeof recipients === 'string') {
      return [
        {
          address: { email: recipients },
        },
      ]
    }

    /**
     * Normalizing an object based string
     */
    return [
      {
        address: {
          email: recipients.address,
          ...(recipients.name ? { name: recipients.name } : {}),
        },
      },
    ]
  }

  /**
   * Returns an array of recipients accepted by the SparkPost API
   */
  #getRecipients(mail: MailMessage): { address: { name?: string; email: string } }[] {
    return this.#formatRecipients(mail.data.to)
      .concat(this.#formatRecipients(mail.data.cc))
      .concat(this.#formatRecipients(mail.data.bcc))
  }

  /**
   * Returns an object of options accepted by the sparkpost mail API
   */
  #getOptions(config: SparkPostConfig) {
    const options = new ObjectBuilder<Record<string, any>>({})

    options.add('start_time', config.startTime)
    options.add('initial_open', config.initialOpen)
    options.add('open_tracking', config.openTracking)
    options.add('click_tracking', config.clickTracking)
    options.add('transactional', config.transactional)
    options.add('sandbox', config.sandbox)
    options.add('skip_suppression', config.skipSuppression)
    options.add('ip_pool', config.ipPool)

    return options.toObject()
  }

  /**
   * Send email
   */
  async send(
    mail: MailMessage,
    callback: (err: Error | null, info: SparkPostSentMessageInfo) => void
  ) {
    const url = `${this.#getBaseUrl()}/transmissions`
    const options = this.#getOptions(this.#config)
    const envelope = mail.message.getEnvelope()
    const recipients = this.#getRecipients(mail)

    debug('sparkpost mail url "%s"', url)
    debug('sparkpost mail options %O', options)
    debug('sparkpost mail envelope %O', envelope)
    debug('sparkpost mail recipients %O', recipients)

    try {
      /**
       * The sparkpost API doesn't accept the multipart stream and hence we
       * need to convert the stream to a string
       */
      const mimeMessage = await text(mail.message.createReadStream())
      const payload = {
        options,
        recipients,
        content: { email_rfc822: mimeMessage },
      }
      const response = await ofetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.#config.key,
          'Content-Type': 'application/json',
        },
        body: payload,
      })

      const sparkPostMessageId = response.body.results.id
      const messageId = sparkPostMessageId
        ? sparkPostMessageId.replace(/^<|>$/g, '')
        : mail.message.messageId()

      callback(null, { messageId, envelope, ...response.body.results })
    } catch (error) {
      callback(
        new E_MAIL_TRANSPORT_ERROR('Unable to send email using the sparkpost transport', {
          cause: error,
        }),
        undefined as any
      )
    }
  }
}

/**
 * AdonisJS mail transport implementation to send emails
 * using Sparkpost's `/message.mime` API endpoint.
 */
export class SparkPostTransport implements MailTransportContract {
  #config: SparkPostConfig

  constructor(config: SparkPostConfig) {
    this.#config = config
  }

  /**
   * Send message
   */
  async send(
    message: NodeMailerMessage,
    config?: SparkPostRuntimeConfig
  ): Promise<MailResponse<SparkPostSentMessageInfo>> {
    const nodemailerTransport = new NodeMailerTransport({ ...this.#config, ...config })
    const transporter = createTransport<SparkPostSentMessageInfo>(nodemailerTransport)

    const sparkPostResponse = await transporter.sendMail(message)
    return new MailResponse(
      sparkPostResponse.messageId,
      sparkPostResponse.envelope,
      sparkPostResponse
    )
  }
}
