"use strict";

window.addEventListener("load", function () {
  const loadButton = document.getElementById("read");
  loadButton.addEventListener("click", loadData);

  const writeButton = document.getElementById("write");
  writeButton.addEventListener("click", writeData);
});

function loadData() {
  const msg = document.getElementById("msg");
  msg.innerText = "読み込み中....";
  window.mainapi.loadData().then((ret) => {
    const title = document.getElementById("title");
    title.value = ret;
    msg.innerText = "";
  });
}

function writeData() {
  const title = document.getElementById("title").value;
  const msg = document.getElementById("msg");
  msg.innerText = "書き込み中....";
  window.mainapi.writeData(title).then((ret) => {
    msg.innerText = "書き込み処理が完了しました";
    console.log(ret);
  });
}
