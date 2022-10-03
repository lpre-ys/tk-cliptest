"use strict";

const { contextBridge, ipcRenderer } = require("electron");

console.log("load preload.js");

contextBridge.exposeInMainWorld("mainapi", {
  loadData: async () => {
    return await ipcRenderer.invoke("push-load").then((result) => {
      return result;
    });
  },
  writeData: async (arg) => {
    return await ipcRenderer.invoke("push-write", arg).then((result) => {
      return result;
    });
  },
});
