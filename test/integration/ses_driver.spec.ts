/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { getDirname } from '@poppinss/utils'
import { test } from '@japa/runner'
import { join } from 'node:path'
import dotenv from 'dotenv'

import { Message } from '../../src/message.js'
import { SesDriver } from '../../src/drivers/ses/driver.js'
import { sleep } from '../../test_helpers/index.js'

const ses = new SesDriver({
  apiVersion: '2010-12-01',
  key: process.env.AWS_ACCESS_KEY_ID!,
  secret: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
  sslEnabled: true,
})

test.group('Ses Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using ses driver', async ({ assert }) => {
    const message = new Message()
    message.from(process.env.AWS_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await ses.send(message.toJSON().message)

    assert.exists(response.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.AWS_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })

  test('define email tags', async ({ assert }) => {
    assert.plan(1)

    const message = new Message()
    message.from(process.env.AWS_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    /**
     * Wait for the transporter to be created
     */
    await sleep(1000)

    // @ts-ignore
    ses['transporter'].sendMail = function (mailMessage: any) {
      assert.deepEqual(mailMessage.ses, {
        Tags: [{ Name: 'foo', Value: 'bar' }],
      })
    }

    await ses.send(message.toJSON().message, {
      Tags: [{ Name: 'foo', Value: 'bar' }],
    })
  })
})
