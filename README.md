RPGツクール2000 クリップボードデータ読み書きサンプル
==============================================

RPGツクール2000の、戦闘アニメのクリップボードデータから、「名前」欄を読み込み、書き換えるサンプルアプリです。  
極力シンプルな作りにしています。参考にどうぞ。

Demo
---------------

※開発中に録った動画の為、メッセージ類が色々表示されていません。

https://user-images.githubusercontent.com/20184833/193537790-eaee5e62-33f6-43f1-9684-a2293e434501.mp4

Usage
--------------

### 起動

node環境があるなら、下記で起動します。

```
npm install
npm start
```

（無いと思いますが）exeから実行したい場合、```npm run build```にて、実行ファイルのビルドが出来ます。  
ビルド後、```dist/win-unpacked/tk-cliptest.exe```実行で、動作します。

ビルドコマンドのアーキテクチャは決め打ちなので、違う環境で実行したい場合は、package.json内のビルドコマンドを書き換えるなり、npxで引数変えて実行するなりしてください。

Note
--------

### 動作環境

ツクール本体同様、Windows環境でしか動きません。

内部でPowerShellを実行しているため、PowerShellが動かない環境だと動きません。  
PowerShellのバージョンや、OSの組み合わせによって動作しない可能性がありますが、調査していません。  

動作しない場合、下記バージョン情報を参考に、環境を整えてみてください。

#### 動作確認済みのバージョン情報

##### OS

Windows 10 Pro 21H2

##### PowerShell

```
PS> $PSVersionTable

Name                           Value
----                           -----
PSVersion                      5.1.19041.1682
PSEdition                      Desktop
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}
BuildVersion                   10.0.19041.1682
CLRVersion                     4.0.30319.42000
WSManStackVersion              3.0
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1
```

### その他注意


サンプルなので、```console.log```が大量に入っています。

また、エラー処理やバリデーションがほとんどありません。  
異常系の操作を実行した場合の挙動は **一切保証しません** ので、ご注意ください。

Author
--------

lpre_ys

https://twitter.com/lpre_ys/

license
---------

[MIT license](https://en.wikipedia.org/wiki/MIT_License).

Memo
-------------

### クリップボード操作の仕組み

Electron及びchromiumのクリップボードAPIでは、FS_PRIVATEFIRST～FS_PRIVATELAST内のクリップボードを読み書きすることが難しい。  
※おそらく、2022年10月現在、不可能。

よって、```fallback/```以下のPowerShellにて、クリップボードデータの読み書きを行っている。  
今回、戦闘アニメ用なので、582は決めうち。他のデータだとこの辺の番号が変わるはず。

node.js側の実装は、```main.js```を参照してください。

### PowerShellスクリプト実装時の注意

```
[System.Windows.Forms.DataFormats]::GetFormat(582)
```
上記メソッド（および、上記と同等の処理を行う別メソッド）を実行してから、クリップボードの操作を記述すること。  
"Get"と言う名前だが、実際には、クリップボードのフォーマット設定定義を内部的に追加している？ようです。（詳細未検証）

実行前に```GetData('Format582')```や```SetData('Format582')```を行ってしまうと、FS_PRIVATEFIRST +70のデータではなく、'Format582'と言う名前の独自フォーマットとして扱われてしまう。  
結果として、RPGツクール2000のクリップボードデータは読めないし、書けない、という事になってしまう。要注意。

また、GetFormat前に、一度でもGetDataやSetDataをしてしまうと、シェルを開き直すまで？FS_PRIVATEFIRST +70としては読めなくなるようなので、手元のCLIで試すときは、本当に注意すること。

3時間くらいハマった。

#### fallback/read.ps1

FS_PRIVATEFIRST +70 (582) のクリップボードデータを読み、MemoryStreamを配列として取得、カンマ区切りの文字列として標準出力する。

node.js側で子プロセスとして実行し、標準出力の結果を、配列->ArrayBufferと変換して読み込む。

#### fallback/write.ps1

クリップボード上のカンマ区切り文字列をMemoryStreamに変換、クリップボードにFS_PRIVATEFIRST +70 (582) として書き込みする。

node.js側で、クリップボード上にカンマ区切り配列データを文字列として書き込んでから、子プロセスとして起動しています。  
※最終的に、戦闘アニメデータがクリップボードに乗るため、クリップボードを裏で書き換えても問題ないという判断。

とかいう挙動なので、書き込み中に違う物コピーすると壊れる可能性があります。  
実アプリで同じ仕組みを使う場合、その点の注意書きが必要。（書き込み中にコピペ動作を行わないでください、等々）

### electron-builderによるアプリビルド時の注意

PowerShellを子プロセスとして実行する仕組みの為、```fallback```フォルダは、そのままexeの階層に居る必要がある。（asarに含めてはいけない）

```package.json```にて、下記設定を行うことにより、fallbackフォルダはasarに含めず、そのままexeの階層にコピーすることが出来る。  

```
  "build": {
    "files": [
      "!fallback"
    ],
    "extraFiles": [
      "fallback"
    ]
  },
```

