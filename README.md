# fax2kintone-function

Twilio CLI Serverless Pluginを使って、Twilioで受信したFAXをkintoneに格納します。

## 準備

以下の環境が必要です。

- Twilioアカウント（アカウントの作成方法→[こちら](https://qiita.com/mobilebiz/items/932eb21ff6ed36f524d8)）
- 着信用電話番号（Twilioで購入した050番号）
- kintoneアカウント
- Twilio CLI（インストール方法→[こちら](https://qiita.com/mobilebiz/items/456ce8b455f6aa84cc1e)）
- Serverless Plugin（インストール方法→[こちら](https://qiita.com/mobilebiz/items/fb4439bf162098e345ae)）

## インストール

```sh
git clone https://github.com/mobilebiz/fax2kintone-function.git
cd fax2kintone-function
npm install
cp .env.sample .env
cp assets/twiml.sample.xml assets/twiml.xml
```

## kintoneアプリの準備

assetsディレクトリの中に、`FAX-APP.zip`というテンプレートアプリがあるので、それをkintoneに読み込みます。  
テンプレートアプリの読み込み方法については、[こちら](https://help.cybozu.com/ja/k/admin/import_template.html)をご覧ください。

アプリが読み込めたら、次にAPIトークンを生成してください。今回使うAPIトークンでは、レコード閲覧の他に、レコード追加の権限が必要になりますので、チェックを入れておきます。  
APIトークンの生成方法は、[こちら](https://help.cybozu.com/ja/k/user/api_token.html)を参考にしてください。なお、作成したAPIトークンはメモ帳などに保存しておいてください。  

今回のアプリには以下の３つのフィールドが定義されています（フィールドコードは変更しないでください）。

フィールド名|フィールドコード|説明
:--|:--|:--
受信日時|receivedDate|FAXが格納された日時が自動的に設定されます
発信番号|from_|発信者の電話番号がE.164形式で保存されます
添付ファイル|pdf|受信したFAXデータがPDF形式で保存されます

## .envファイルの編集

エディタで`.env`ファイルを開き、以下の項目を編集します。  
<font color='red'>【注意】</font>先頭の２行（ACCOUNT_SIDとAUTH_TOKEN）は編集しないようにしてください。  

項目名|設定内容
:--|:--
MASTER_ACCOUNT_SID|ACから始まるTwilioのAccountSid
KINTONE_DOMAIN|ご自分のkintoneのサブドメイン名（xxxxx.cybozu.comのxxxxxの部分）
KINTONE_APP_ID|作成したkintoneのアプリID（アプリIDは、URLから判別可能です。https://（サブドメイン名）.cybozu.com/k/（アプリのID）/）
KINTONE_API_TOKEN|先程控えておいたAPIトークン

## ローカルテスト

以下のコマンドでローカル実行します。

```sh
npm start
（中略）
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   Twilio functions available:                                          │
│   ├── [protected] /del-faxes | http://localhost:3000/del-faxes         │
│   └── [protected] /save2kintone | http://localhost:3000/save2kintone   │
│                                                                        │
│   Twilio assets available:                                             │
│   ├── /FAX-APP.zip | http://localhost:3000/FAX-APP.zip                 │
│   ├── /fax-sample.pdf | http://localhost:3000/fax-sample.pdf           │
│   ├── /twiml.sample.xml | http://localhost:3000/twiml.sample.xml       │
│   └── /twiml.xml | http://localhost:3000/twiml.xml                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

上記のようにローカル起動が成功したら、以下のURLをブラウザで開きます。  

[http://localhost:3000/save2kintone?FaxStatus=received](http://localhost:3000/save2kintone?FaxStatus=received)  

画面上に`OK`と表示されて、kintoneアプリ側には１件データが登録されていれば成功です。  
ローカル実行を終了するには、`Ctrl-C`を押します。  

## サーバーにデプロイ

以下のコマンドでサーバーにデプロイします。

```sh
twilio serverless:deploy

（中略）

✔ Serverless project successfully deployed

Deployment Details
Domain: fax2kintone-function-XXXX-dev.twil.io
Service:
   fax2kintone-function (ZSxxxxxxxxxxxxxxxxxxxxxxx)
Environment:
   dev (ZExxxxxxxxxxxxxxxxxxxxxxx) 
Build SID:
   ZBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
View Live Logs:
   https://www.twilio.com/console/assets/api/ZSxxxxxxxxxxxxxxxxxxxxxxxx/environment/ZExxxxxxxxxxxxxxxxxxxxxxxxxxxx
Functions:
   [protected] https://fax2kintone-function-XXXX-dev.twil.io/del-faxes
   [protected] https://fax2kintone-function-XXXX-dev.twil.io/save2kintone
Assets:
   https://fax2kintone-function-XXXX-dev.twil.io/FAX-APP.zip
   https://fax2kintone-function-XXXX-dev.twil.io/fax-sample.pdf
   https://fax2kintone-function-XXXX-dev.twil.io/twiml.sample.xml
   https://fax2kintone-function-XXXX-dev.twil.io/twiml.xml
```

表示された結果の中の、Functions項目にあるsave2kintoneへのリンクURLをメモ帳に保存してください。  

## assets/twiml.xmlの編集

エディタで`assets/twiml.xml`を開きます。  

3行目に書かれている`action=`で指定しているURLを上でメモしたリンクURLに書き換えます（シングルクォーテーションを削除しないように気をつけてください）。  
編集が完了したら、上書き保存します。

## 再度デプロイ

`twiml.xml`を編集したので、もう一度以下のコマンドでデプロイします。

```sh
twilio serverless:deploy

（中略）

Functions:
   [protected] https://fax2kintone-function-XXXX-dev.twil.io/del-faxes
   [protected] https://fax2kintone-function-XXXX-dev.twil.io/save2kintone
Assets:
   https://fax2kintone-function-XXXX-dev.twil.io/FAX-APP.zip
   https://fax2kintone-function-XXXX-dev.twil.io/fax-sample.pdf
   https://fax2kintone-function-XXXX-dev.twil.io/twiml.sample.xml
   https://fax2kintone-function-XXXX-dev.twil.io/twiml.xml
```

デプロイが完了したら、最後に表示された`twiml.xml`へのリンクURLをメモ帳に保存してください。  

## 電話番号の設定

Twilioの管理コンソールにログインします。  

- スライドメニューから**Phone Numbers**を選択し、**番号の管理** > **アクティブな電話番号**を選択します。
- 購入済みの電話番号の一覧から、今回FAX着信に利用する電話番号を選択して設定画面を開きます（電話番号がリンクになっています）。  
- **Voice & Fax**セクションの中の、**ACCESPT INCOMING**を、**Faxes**に変更します。  
- **A FAX COMES IN**のプルダウンを**Webhook**にし、その右側の欄に先程メモしたtwiml.xmlのリンクURLを記載します。さらに右側のプルダウンから**HTTP GET**を選択します。  
- **Save**ボタンを押します。

## テスト

以上ですべての設定が完了です。  
設定した電話番号にFAXを送信してみて、kintoneに格納されることを確認してください。  

不明な点や問題が発生したら、このGithubの[Issues](https://github.com/mobilebiz/fax2kintone-function/issues)まで。
