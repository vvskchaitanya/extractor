var PDFParser = require("pdf2json/pdfparser"); 

function parsePdf(){
    var pdfFilePath="320153_STAMPED.pdf";

    var pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", ()=>{
        console.error("Error Parsing PDF");
    });
    pdfParser.on("pdfParser_dataReady",(pdfData)=>{
        processPdfData(pdfData)

    });
    var verbosity = false ? 1 : 0;
    pdfParser.loadPDF(pdfFilePath, verbosity);
}

function processPdfData(pdf){
    var pageNumber = 0;
    var Pages = pdf.Pages || pdf.formImage.Pages;
    var pages=[];
    for (var p in Pages) {
        var page = Pages[p];
        ++pageNumber;
        console.log("---------------Page "+pageNumber+"--------------");
        if(page.Texts!=null && page.Texts.length>0){
            var pageText="";
            for(var t in page.Texts){
                if(page.Texts[t].R!=null && page.Texts[t].R[0]!=null){
                    pageText+=decodeURIComponent(page.Texts[t].R[0].T)+" ";
                }
            }
        }
        var page={number:pageNumber, text:pageText};
        pages.push(page);
    }
    return pages;
}

parsePdf();