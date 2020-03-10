/**
 * Twilio上でFAXの受信が完了したとき（エラーも含む）に呼ばれるFunction
 */
exports.handler = async function(context, event, callback) {

  console.log("event:",event);

  // FAXが受信されているかを確認
  if ("received" != event.FaxStatus) {
      console.log("not fax?");
      console.log("FaxStatus:" + event.FaxStatus);
      console.log("ErrorCode:" + event.ErrorCode);
      console.log("From:" + event.From);
      callback(null, "not fax?");
  } else {
    const faxUrl = event.MediaUrl || `http://${context.DOMAIN_NAME}/fax-sample.pdf`;  // FAXが格納されているURL

    let tmpFile;  // FAXデータを一時的に保管しておくローカルストレージ

    await downloadPDF(faxUrl)
    .then(async () => {
      // ダウンロード成功
      return await saveKintone(context, event);
    })
    .then(() => {
      // kintone保存成功
      callback(null, 'OK');
    })
    .catch(err => {
      console.log(`ERROR: ${err}`);
      callback(null, err.message);
    });
  }
};

/**
 * Twilio上に保存されているFAXデータのダウンロード
 * @param {string} faxUrl FAXデータの格納先URL
 */
const downloadPDF = async (faxUrl) => {
  const rp = require('request-promise');
  const fs = require('fs');
  const util = require('util');

  const options = {
    method: 'GET',
    uri: faxUrl,
    encoding: null
  };

  const tmpFilename = util.format("%s.pdf", Math.floor(10000 * 10000 * Math.random()).toString(16));
  tmpFile = `/tmp/${tmpFilename}`;
  console.log("tmpFile:", tmpFile);

  await rp(options)
  .then(parsedBody => {
    fs.writeFileSync(tmpFile, parsedBody);
  })
  .catch(err => {
    console.log("Download error.", err);
    throw err;
  })
  .finally(() => {
    console.log("Downloaded.");
    return;
  });
};

/**
 * kintoneにファイルをアップロード
 * @param {Object} context Twilioから渡されたコンテキストオブジェクト
 * @param {Object} event Twilioから渡されたイベントオブジェクト
 */
const saveKintone = async (context, event) => {
  const kintone = require('@kintone/kintone-js-sdk');

  // kintone認証設定（API KEY）
  let kintoneAuth = new kintone.Auth();
  kintoneAuth.setApiToken({
    apiToken: context.KINTONE_API_TOKEN
  });

  // コネクション作成
  const connection = new kintone.Connection({
    domain: `${context.KINTONE_DOMAIN}.cybozu.com`,
    auth: kintoneAuth
  });

  // 添付ファイル
  const kintoneFile = new kintone.File({
    connection: connection
  });

  // レコード作成
  const kintoneRecord = new kintone.Record({
    connection: connection
  });

  // kintoneにアップロード
  console.log("tmpFile", tmpFile);
  const param = {
    filePath: tmpFile
  };
  await kintoneFile.upload(param)
  .then(async res => {
    console.log("Uploaded.", res.fileKey);

    // レコード追加
    const record = {
      "from_": {
        "value": event.From || 'Unknown sender'
      },
      "pdf": {
        "value": [
          {
            "fileKey": res.fileKey
          }
        ]
      }
    };

    return await kintoneRecord.addRecord({
      app: context.KINTONE_APP_ID,
      record: record
    });
  })
  .then(res => {
    // レコード追加成功
    console.log('Record added.');
    return;
  })
  .catch(err => {
    console.log('kintone upload error.', err);
    throw err;
  });  
  
};