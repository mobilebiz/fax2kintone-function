/**
 * Faxリソースをすべて削除（メンテナンス用）
 * ＜注意＞該当アカウントのFAXリソースが、送信中のものを含めすべて削除されます。
 */
exports.handler = function(context, event, callback) {
    const twilio = require('twilio');

    const myAccountSid = context.MASTER_ACCOUNT_SID; // アカウントSIDを記載します
    const apiKey = context.ACCOUNT_SID; // .envにデフォルトで記載されている値を使います
    const apiSecret = context.AUTH_TOKEN; // .envにデフォルトで記載されている値を使います

    const client = twilio(apiKey, apiSecret, { accountSid: myAccountSid });
    // const client = context.getTwilioClient();
    client.fax.faxes.list()
    .then(async faxes => {
        await faxes.forEach(async fax => {
            console.log(fax.sid, fax.status);
            if (fax.status === 'receiving') {
                await client.fax.faxes(fax.sid).update({
                    status: 'canceled'
                })
                .then(async () => {
                    await client.fax.faxes(fax.sid).remove();
                })
            } else {
                await client.fax.faxes(fax.sid).remove();
            }
        });
        callback(null, 'OK');
    })
    .catch(err => {
        console.log('ERROR', err);
        callback(err.message);
    })
}