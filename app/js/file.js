// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright © 2018-2022 Sander Stolk

function downloadFile(name, content, type) {
  blob = contentToBlob(content);
  downloadViaAhref(name, URL.createObjectURL(blob));
}

function dataURIToBlob(dataURI) {
  var content = dataURI.split(',')[1];
  return contentToBlob(content);
}

function contentToBlob(content) {
  const bytes = new TextEncoder().encode(content);
  const blob = new Blob([bytes], {
    type: "application/json;charset=utf-8"
  });
  return blob;
}

function downloadViaAhref(name, href) {
  var a = document.createElement('a');
  a.href = href;
  a.target = '_blank';
  a.download = name;
  a.click();

  // remove object url (if present)
  a.onclick = function() {
    requestAnimationFrame(function() {
      URL.revokeObjectURL(a.href);
    });
    a.removeAttribute('href');
  };
}


function selectFile(handler) {
  var hiddenElement = document.createElement('input');
  hiddenElement.setAttribute('type', 'file');
  hiddenElement.addEventListener('change', saveSelectedFileInLocalStorage);
  hiddenElement.style.display = 'none';
  document.documentElement.appendChild(hiddenElement);
  hiddenElement.click();
}

function saveSelectedFileInLocalStorage(ev) {
  var files = ev.srcElement.files;
  if (files.length > 0)
    saveInLocalStorage(files[0], LOCALSTORAGE_KEY);
}

function saveInLocalStorage(file, key) {
  if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
      localStorage.setItem(key, evt.target.result);
      alert("Succesfully read file into localStorage");
    }
    reader.onerror = function (evt) {
      alert("Unable to read file");
    }
  }
}
