"use strict";

const { rejects } = require("assert");
const { app, BrowserWindow, ipcMain, clipboard } = require("electron");
const path = require("path");
const iconv = require("iconv-lite");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
};

// Passthrough is not supported, GL is disabled, ANGLE is とか言うエラーを消すヤツ
app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// データ読み書き系
let clipData = null;
let clipDataLength = 0;

ipcMain.handle("push-load", (event, arg) => {
  console.log("push-load!!!");

  return loadEffectData();
});
ipcMain.handle("push-write", (event, arg) => {
  console.log("push-write!!!", arg);

  return writeEffectData(arg);
});

function loadEffectData() {
  return new Promise((resolve) => {
    const spawn = require("child_process").spawn;
    const child = spawn("powershell.exe", [
      "-ExecutionPolicy",
      "RemoteSigned",
      "./fallback/read.ps1",
    ]);

    let psResult;

    child.on("exit", (code) => {
      console.log("PS exit. code:", code);
      if (code === 0) {
        console.log("Exit data:", psResult);
        resolve(psResult);
      } else {
        rejects(code);
      }
    });

    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", function (data) {
      // データ読み込み
      console.log("on stdout data");
      clipData = data.toString().trim().split(",");
      console.log("dataArray:", clipData);
      const tArray = new Uint8Array(clipData);
      const view = new DataView(tArray.buffer);
      console.log("data", tArray.buffer);
      // 全体のデータ数の取得
      clipDataLength = view.getUint32(0, true);
      console.log("dataLength:", clipDataLength);
      const length = view.getUint8(9);
      // 文字の取得
      console.log("strLength:", length);
      const titleBuffer = tArray.slice(10, 10 + length);
      const decoder = new TextDecoder("shift-jis");
      const title = decoder.decode(titleBuffer);

      psResult = title;
    });

    child.stderr.on("data", function (data) {
      console.log("Powershell Errors: " + data);
    });

    child.stdin.end();
  });
}

function writeEffectData(title) {
  if (!clipData) {
    return false;
  }
  // タイトルの改変
  // 入力テキストをSJISに変換
  const titleBuffer = iconv.encode(title, "Shift_JIS");
  // 長さの算出
  const oldLength = clipDataLength;
  const oldTitleLength = clipData[9];

  const newTitleLength = titleBuffer.length;
  const newLength = oldLength - oldTitleLength + newTitleLength;

  console.log("old allLength:", oldLength, "titleLength:", oldTitleLength);
  console.log("new allLength:", newLength, "titleLength:", newTitleLength);

  // 新しい長さを32ビットのバイト列に変換
  const header = new ArrayBuffer(4);
  console.log(header);
  const view = new DataView(header);
  view.setUint32(0, newLength, true);
  console.log("newLength Buffer:", header);

  // 更新データの作成
  const newClipData = [];
  newClipData.push(...new Uint8Array(header));
  newClipData.push(...clipData.slice(4, 9));
  newClipData.push(newTitleLength);
  newClipData.push(...titleBuffer);
  newClipData.push(...clipData.slice(10 + parseInt(oldTitleLength)));

  console.log("old:", clipData.join(","));
  console.log("new:", newClipData.join(","));

  // 更新データで内部データを上書き
  clipData = newClipData;

  // 保存データをStringにしてクリップボードに保存
  const strData = clipData.join(",");
  clipboard.writeText(strData);

  // powershellを呼び出す
  return new Promise((resolve) => {
    const spawn = require("child_process").spawn;
    const child = spawn("powershell.exe", [
      "-ExecutionPolicy",
      "RemoteSigned",
      "./fallback/write.ps1",
    ]);

    child.on("exit", (code) => {
      console.log("PS exit. code:", code);
      if (code === 0) {
        console.log("Exit");
        resolve();
      } else {
        rejects(code);
      }
    });

    child.stdout.setEncoding("utf-8");
    child.stdout.on("data", function (data) {
      console.log("on stdout data");
      console.log(data);
    });

    child.stderr.on("data", function (data) {
      console.log("Powershell Errors: " + data);
    });

    child.stdin.end();
  });
}
