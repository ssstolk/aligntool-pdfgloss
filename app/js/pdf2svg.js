// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright © 2018-2022 Sander Stolk

var files; // FileList object.
var curFileNumber; // current file number
var curPageNumber; // current page number 
var alignmentData;

var PAGE_SCALE = 1;
var SVG_NS = 'http://www.w3.org/2000/svg';


function getAlignmentData() {
    if (!alignmentData) {
        data = localStorage.getItem(LOCALSTORAGE_KEY);
        alignmentData = data ? JSON.parse(data) : {};
    }
    return alignmentData;
}

function setAlignmentData(data) {
    alignmentData = data;
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
}

function changeAnnotation(ev) {
    var annotation = ev.currentTarget.value;

    var cellId = ev.currentTarget.parentElement.getAttribute('id');
    var rowId = cellId.substr(0, cellId.indexOf('-'));
    var rowIndex = rowId.substr('row'.length);
    
    // update local storage
    var alignmentData = getAlignmentData();
    var tableKey = files[curFileNumber].name+":"+curPageNumber;
    var tableData = alignmentData[tableKey];
    
    if (!tableData)
      return;
    
    var rowData = tableData[rowIndex];
    if (rowData.match === undefined) rowData.match = new Array();
    rowData.annotation = annotation;
    alignmentData[tableKey] = tableData;
    setAlignmentData(alignmentData);
}

function getSanitizedString(textItem) {
    var s = textItem.str;
    s = s.replace(new RegExp("®", 'g'), "ǣ");
    s = s.replace(new RegExp("¢", 'g'), "fi");
    s = s.replace(new RegExp("©", 'g'), "ӯ");
    s = s.replace(new RegExp("Ï", 'g'), "fl");
    s = s.replace(new RegExp("½", 'g'), "eo");
    s = s.replace(new RegExp("¡", 'g'), "ǣ");
    return s;
}

function getEntries(textContent, pageNumber) {
    var entries = [];
    var entry = "";
//console.log(textContent);
    for (var i=0; i<textContent.items.length; i++) {
        var textItem = textContent.items[i];
        var location = textItem.transform;
        
        if (isEntryMaterial(pageNumber, location)) {
            if (isEntryStart(pageNumber, location)) {
                if (entry != "") {
                    entries.push(entry);
                }
                entry = getSanitizedString(textItem);
            }
            else if (entry != "") {
                entry += getSanitizedString(textItem);
            }
        }
    }
    if (entry != "") {
        entries.push(entry);
    }
//    console.log(entries);
    return entries;
}

function getPoS(entry) {
    // view regex pattern here: https://regex101.com/r/dtj1gi/1
    var posPatt = /^[^,]*,\s*([a-zA-Z\s]*\.?(\s*[0-9IVX]+\s*(?=[,(]))?)/;
    var match = entry.match(posPatt);
    if (match == null || match.length < 2) {
        return null;
    }
    var s = match[1];
    if (s.startsWith("see")) {
        return null;
    }
    return s;
}

function getLemma(entry) {
    var pos = entry.indexOf(",");
    if (pos < 0) {
        return entry;
    }
    s = entry.substr(0,pos);
    s = s.replace(new RegExp("[•*‡†+̄ ̄]*", 'g'), "").replace(new RegExp("\\(\\)", 'g'), "");
    return s.trim();
}

function buildTable(fileNumber, pageNumber, textContent) {
    var alignmentData = getAlignmentData();
    var tableKey = files[fileNumber].name+":"+pageNumber;
    var tableData = alignmentData[tableKey];
    if (!tableData) {
        tableData = new Array();
        
        var entries = getEntries(textContent, pageNumber);
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            var lemma = getLemma(entry);
            var pos = getPoS(entry);
            tableData.push({entry, lemma, pos});
        };
        alignmentData[tableKey] = tableData;
        setAlignmentData(alignmentData);
    }
    
    // reset table
    var table = document.getElementById("mappingTable");
    table.innerHTML = "";
    
    // form header
    var header = table.createTHead();
    var row = header.insertRow(0);     
    row.insertCell(0).innerHTML = "Entry";
    row.insertCell(1).innerHTML = "PoS";
    row.insertCell(2).innerHTML = "Corresponds with...";
    row.insertCell(3).innerHTML = "Annotation...";

    // form content
    for (var i=0; i<tableData.length; i++) {
        var rowData = tableData[i];
        var entry = rowData.entry;
        var lemma = rowData.lemma;
        var pos = rowData.pos;
        var annotation = rowData.annotation;
        
        var row = table.insertRow(-1);
        var rowId = "row" + i;
        row.setAttribute("id", rowId);
        
        var cellEntry = row.insertCell(-1);
        cellEntry.setAttribute("id", rowId + "-" + "cellEntry");
        cellEntry.innerHTML = lemma;
        cellEntry.setAttribute("title", entry);
        
        var cellPoS = row.insertCell(-1);
        cellPoS.setAttribute("id", rowId + "-" + "cellPoS");
        cellPoS.innerHTML = pos;
        
        var cellMapping = row.insertCell(-1);
        cellMapping.setAttribute("id", rowId + "-" + "cellMapping");
        cellMapping.setAttribute("ondrop", "drop(event);");
        cellMapping.setAttribute("ondragover", "allowDrop(event);");
        cellMapping.innerHTML = getHTMLforMappingCell(tableKey, i, rowData); 
        
        var cellAnnotation = row.insertCell(-1);
        cellAnnotation.setAttribute("id", rowId + "-" + "cellAnnotation");
        var input = document.createElement("textarea");
        input.setAttribute("id", rowId + "-" + "cellAnnotation" + "-" + "input");
        //input.setAttribute("placeholder", "#beowulf");
        input.value = annotation ? annotation : "";
        input.addEventListener('input', changeAnnotation);
        cellAnnotation.appendChild(input);
    };
}

function getHTMLforMappingCell(tableKey, rowIndex, data) {
    var html = '';
    for (var i=0; data.match && i<data.match.length; i++) {
        var match = data.match[i]['text/html'] + 
            ' <span style="cursor:pointer; padding-left:5px;" title="discard match" onClick="discardMatch(\''+tableKey.replace(/'/g, "\\\'")+'\','+rowIndex+','+i+')">✕</span>'; //data.match[i];
        html += match + ' <br/>';
    }
    
    var lemma = data.lemma;
    var searchkey = lemma.replace(/[\-•*]/g, "").replace(/ð/g, "þ").replace(/\([^)]*\)/g, "").normalize('NFD').replace(/[\u0300-\u0303\u0305-\u036f]/g, "").normalize('NFKC');
    // note: It would be better to keep using NFD normalization. Doing so decomposes symbols, separating ā into a and - etc.
    //       Evoke currently does not take care of such search strings, however. Nor does it have the search keys in the triplestore saved in this manner.
    //       For future improvement, when Evoke has been updated to take care of these matters, simply remove the normalization to NFKC.
    return  html + '<a target="evoke-search" href="http://evoke.ullet.net/app/#/search?source=toe&key='+searchkey+'&limit=0&type=sense" style="text-decoration: none;"><div class="dropzone dropzone-match">Drop search hit from Evoke here / <img src="http://evoke.ullet.net/app/static/img/evoke.svg" width="45" alt="evoke"></div></a>';
}

function discardMatch(tableKey, rowIndex, matchIndex) {
    // update local storage
    var alignmentData = getAlignmentData();
    var tableData = alignmentData[tableKey];
    var tableRow = tableData[rowIndex];
    tableRow.match.splice(matchIndex,1);
    if (tableRow.match.length == 0)
      tableRow.annotation = undefined;
    alignmentData[tableKey] = tableData;
    setAlignmentData(alignmentData);
    
    // refresh mapping cell
    var cellMapping = document.getElementById("row" + rowIndex + "-" + "cellMapping");
    cellMapping.innerHTML = getHTMLforMappingCell(tableKey, rowIndex, tableData[rowIndex]);
}


function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
  
    if (ev.dataTransfer.types.length === 0)
        return;
  
    var data = {};
    for (const type of ev.dataTransfer.types){
        data[type] = ev.dataTransfer.getData(type); 
    }
    
    var cellId = ev.currentTarget.getAttribute('id');
    var rowId = cellId.substr(0, cellId.indexOf('-'));
    var rowIndex = rowId.substr('row'.length);
    
    // update local storage
    var alignmentData = getAlignmentData();
    var tableKey = files[curFileNumber].name+":"+curPageNumber;
    var tableData = alignmentData[tableKey];
    
    if (!tableData)
        return;
    
    var rowData = tableData[rowIndex];
    if (rowData.match === undefined) rowData.match = new Array();
    rowData.match.push(data);
    alignmentData[tableKey] = tableData;
    setAlignmentData(alignmentData);
    
    // refresh mapping cell
    var cellMapping = document.getElementById(rowId + "-" + "cellMapping");
    cellMapping.innerHTML = getHTMLforMappingCell(tableKey, rowIndex, tableData[rowIndex]);
}


function buildNavigation(fileNumber, pageNumber, pdfDocument) {
//console.log(pdfDocument);
    var nav = document.getElementById("pageNavigation");
    nav.innerHTML = "";
    
    if (pageNumber > 1) {
        var button = document.createElement("button");
        button.innerHTML = "&lt;&lt;";
        button.addEventListener('click', function(){
            readPage(fileNumber, pageNumber-1);
        });
        nav.appendChild(button);
    }
    var spanPage = document.createElement("span");
    var textPage = document.createTextNode(" " + "Page " + pageNumber + " of " + pdfDocument._pdfInfo.numPages + " ");
    spanPage.appendChild(textPage);
    spanPage.addEventListener('click', function() { 
        var pageSelected = prompt("Please enter the page you wish to skip to:", "1");
        if (pageSelected != null && !isNaN(pageSelected) && pageSelected >= 1) {
            readPage(fileNumber, Number.parseInt(pageSelected));
        }
    });
    nav.appendChild(spanPage);
    if (pageNumber < pdfDocument._pdfInfo.numPages) {
        var button = document.createElement("button");
        button.innerHTML = "&gt;&gt;";
        button.addEventListener('click', function(){
            readPage(fileNumber, pageNumber+1);
        });
        nav.appendChild(button);
    }
    var span = document.createElement("span");
    span.setAttribute("id", "toggleVisibilityPDF");
    span.innerHTML = "<a onClick='javascript:document.getElementById(\"pageContainer\").style.display=\"inline-block\"'>show</a> / " +
                     "<a onClick='javascript:document.getElementById(\"pageContainer\").style.display=\"none\"'>hide</a>";
    nav.appendChild(span);
}



function buildSVG(viewport, textContent) {
  // Building SVG with size of the viewport (for simplicity)
  var svg = document.createElementNS(SVG_NS, 'svg:svg');
  svg.setAttribute('width', viewport.width + 'px');
  svg.setAttribute('height', viewport.height + 'px');
  // items are transformed to have 1px font size
  svg.setAttribute('font-size', 1);
  // processing all items
  textContent.items.forEach(function (textItem) {
    var tx = pdfjsLib.Util.transform(
      pdfjsLib.Util.transform(viewport.transform, textItem.transform),
      [1, 0, 0, -1, 0, 0]);
    var style = textContent.styles[textItem.fontName];
    // adding text element
    var text = document.createElementNS(SVG_NS, 'svg:text');
    text.setAttribute('transform', 'matrix(' + tx.join(' ') + ')');
    text.setAttribute('font-family', style.fontFamily);
    text.textContent = getSanitizedString(textItem);
    svg.appendChild(text);
  });
  
    var container = document.getElementById('pageContainer');
    container.innerHTML = "";
    container.appendChild(svg);
}

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }
  
  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
      output.push('<option value="',i,'">', f.name, '</option>');
    }
    document.getElementById('list').innerHTML = '<p>Choose file: <select onChange="readPage(value)">' + output.join('') + '</select></p>';
	
	// read first file
    readPage(0);
  }
  
  function readPage(fileNumber, pageNumber=1) {
      var file = files[fileNumber]; 
      var fileReader = new FileReader();  
      fileReader.onload = function() {
        var typedarray = new Uint8Array(this.result);
            // Loading document and page text content
            var loadingTask = pdfjsLib.getDocument({ data: typedarray });
            loadingTask.promise.then(function(pdfDocument) {
                pdfDocument.getPage(pageNumber).then(function (page) {
                var viewport = page.getViewport(PAGE_SCALE);
                page.getTextContent().then(function (textContent) {
                    
                    curFileNumber = fileNumber;
                    curPageNumber = pageNumber;
                    
                    buildNavigation(fileNumber, pageNumber, pdfDocument);
                    buildSVG(viewport, textContent);
                    buildTable(fileNumber, pageNumber, textContent);
                    
                });
              });
        });
    };
	fileReader.readAsArrayBuffer(file);
  }


document.addEventListener('DOMContentLoaded', function () {
  if (typeof pdfjsLib === 'undefined') {
    alert('Built version of PDF.js was not found.\n' +
          'Please run `gulp dist-install`.');
    return;
  }
  
  // Set up the worker source (should match version of pdf.js)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.2/pdf.worker.min.js';
  
  // Set up the dnd listeners.
  var dropZone = document.getElementById('dropzone-files');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
});


