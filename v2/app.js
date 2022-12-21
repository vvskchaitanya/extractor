const {app, BrowserWindow} = require('electron') // http://electronjs.org/docs/api
const path = require('path') // https://nodejs.org/api/path.html
const url = require('url') // https://nodejs.org/api/url.html

var http = require('http');
var fs = require('fs');

var PDFParser = require("pdf2json/pdfparser");

let window = null

// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  window = new BrowserWindow({
    icon: "app-logo.jpg",
    backgroundColor: '#2e2c29',
    // Set the initial width to 600px
    width: 600,
    // Set the initial height to 500px
    height: 500,
    // Don't show the window until it ready, this prevents any white flickering
    show: false,
    // Don't allow the window to be resized.
    resizable: true,
    fullscreenable : true
  })

  // Load a URL in the window to the local index.html path
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Show window when page is ready
  window.once('ready-to-show', () => {
    window.show()
  })
});

function processPdfData(pdf){
  var pageNumber = 0;
  var Pages = pdf.Pages || pdf.formImage.Pages;
  var pages=[];
  for (var p in Pages) {
      var page = Pages[p];
      ++pageNumber;
      console.log("--------------Processing Page "+pageNumber+"--------------");
      if(page.Texts!=null && page.Texts.length>0){
          var pageText="";
          for(var t in page.Texts){
              if(page.Texts[t].R!=null && page.Texts[t].R[0]!=null){
                  pageText+=decodeURIComponent(page.Texts[t].R[0].T)+" ";
              }
          }
      }
      console.log(pageText);
      var page={number:pageNumber, text:pageText};
      pages.push(page);
  }
  return pages;
}

//create a server object:
http.createServer(function (req, res) {
  const headers={
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "Access-Control-Allow-Headers": "*"
  };
  if(req.method === "OPTIONS") {
      res.writeHead(204, headers);
      res.end();
      return;
  }
  else if(req.method=="POST" && req.url.indexOf("/parsePdf") == 0) {
      var data="";

      var pdfParser = new PDFParser();
      pdfParser.on("pdfParser_dataError", ()=>{
          console.error("Error Parsing PDF");
      });
      pdfParser.on("pdfParser_dataReady",(pdfData)=>{
          var response = processPdfData(pdfData);
          res.writeHead(200, headers);
          res.write(JSON.stringify(response));
          res.end();
      });

      req.on("data",(d)=>data+=d);
      req.on("end",()=>{
        var pdfFilePath = JSON.parse(data).filePath;
        pdfFilePath = decodeURIComponent(pdfFilePath);
        var verbosity = false ? 1 : 0;
        pdfParser.loadPDF(pdfFilePath, verbosity);
      });
            
  }else{
      res.writeHead(404);
      res.end();
  }
}).listen(7777);
