var regexp_in_mm_1=/((\d+(\.\d+))+(\s(−|to)\s)+(\d+(\.\d+))+(\sin.\s)+([(])+(\d+(\.\d+))+(\s(−|to)\s)+(\d+(\.\d+))+(\smm[)]))/g;
var regexp_mm_in_2=/(([(])+(\d+(\.\d+))+(\s(−|to)\s)+(\d+(\.\d+))+(\smm[)]\s)+(\d+(\.\d+))+(\s(−|to)\s)+(\d+(\.\d+))+(\sin.))/g;
var regexp_in_mm_3=/((\d+(\.\d+))+(\sin.\s)+([(])+(\d+(\.\d+))+(\smm[)]))/g;
var regexp_dec = /(\d+(\.\d+))/g;

var app = new Vue({
    el: '#app',
    data: {
      fileSelected:false,
      loading:false,
      data:[]
    },
    methods:{
        chooseFile:function(event){
            console.log(event);
            var fileInputElement = document.getElementById("fileInput");
            console.log("File Selected ",fileInputElement.files[0].path);
            this.fileSelected = fileInputElement.files.length>0?true:false;
        },
        process:function(){
            console.log("process started");
            this.loading=true;
            var filePath = document.getElementById("fileInput").files[0].path;
            $.post("http://localhost:7777/parsePdf",JSON.stringify({filePath:filePath}),function(resp){
               app.processResponse(resp);
               app.loading=false;
            });
        },
        processResponse:function(resp){
            var pdfresponse=JSON.parse(resp);
            console.log("PDF Response ",pdfresponse);
            for(var p in pdfresponse){
                var text = pdfresponse[p].text;
                text = text.toLowerCase();
                var m1=text.match(regexp_in_mm_1);
                var m2=text.match(regexp_mm_in_2);
                var m3=text.match(regexp_in_mm_3);
                for(var m in m1){
                    var r1={p:pdfresponse[p].number,t:m1[m],c:1};
                    this.processExtracted(r1);
                    app.data.push(r1);
                }
                for(var m in m2){
                    var r2={p:pdfresponse[p].number,t:m2[m],c:2};
                    this.processExtracted(r2);
                    app.data.push(r2);
                }
                for(var m in m3){
                    var r3={p:pdfresponse[p].number,t:m3[m],c:3};
                    this.processExtracted(r3);
                    app.data.push(r3);
                }
            }
        },
        processExtracted:function(record){
            var vals = record.t.match(regexp_dec);
            if(record.c==1){
                record.in={"from":vals[0],"to":vals[1]};
                record.mm={"from":vals[2],"to":vals[3]};
                record.cmm = {"from":this.convert2mm(record.in.from),"to":this.convert2mm(record.in.to)};
                record.vf = record.mm.from == record.cmm.from; 
                record.vt = record.mm.to == record.cmm.to;
                record.v = record.vf && record.vt?"Valid":"Invalid";
            }
            else if(record.c==2){
                record.mm={"from":vals[0],"to":vals[1]};
                record.in={"from":vals[2],"to":vals[3]};
                record.cmm = {"from":this.convert2mm(record.in.from),"to":this.convert2mm(record.in.to)};
                record.vf = record.mm.from == record.cmm.from; 
                record.vt = record.mm.to == record.cmm.to;
                record.v = record.vf && record.vt?"Valid":"Invalid";
            }
            else if(record.c==3){
                record.in={"from":vals[0],"to":""};
                record.mm={"from":vals[1],"to":""};
                record.cmm = {"from":this.convert2mm(record.in.from),"to":this.convert2mm(record.in.to)};
                record.vf = record.mm.from == record.cmm.from; 
                record.vt = record.mm.to == record.cmm.to;
                record.v = record.vf && record.vt?"Valid":"Invalid";
            }
        },
        convert2mm:function(inch){
            var mm="";
            if(inch==null || inch=="")return mm;
            try{
                if(inch.indexOf(".")>0){
                    var d = inch.length-inch.indexOf(".")-1;
                    mm = "" + this.roundOff(((25.4) * parseFloat(inch)),(d-1)).toFixed(d-1);
                }
            }catch(err){
                console.error(err);
                return mm;
            }
            return mm;
        },
        roundOff:function(number,places) {
            return +(Math.round(number + "e+" + places)  + "e-" + places);
        },
        download:function(){
            console.log("Download Excel");
            var data=[];
            var head=["Page","Text Extracted","From (in.)","To (in.)","From (mm)","To (mm)","From Conversion (in. to mm)","To Conversion (in. to mm)","Comparision"];
            data.push(head);
            for(var i in this.data){
                var r = this.data[i];
                var row = [r.p,r.t,r.in.from,r.in.to,r.mm.from,r.mm.to,r.cmm.from,r.cmm.to,r.v];
                data.push(row);
            }

        // (C2) CREATE NEW EXCEL "FILE"
        var workbook = XLSX.utils.book_new(),
        worksheet = XLSX.utils.aoa_to_sheet(data);
        workbook.SheetNames.push("Extract");
        
        for(var i=0;i<this.data.length;i++){
            
            if(worksheet["E"+(i+2)]!=undefined && !this.data[i].vf){
                worksheet["E"+(i+2)].s = { fill: { fgColor: { rgb: "#db7093" } } };
            }
            if(worksheet["F"+(i+2)]!=undefined && !this.data[i].vt){
                worksheet["F"+(i+2)].s = { fill: { fgColor: { rgb: "#db7093" } } };
            }
            
        }
        workbook.Sheets["Extract"] = worksheet;
        var fileName = document.getElementById("fileInput").files[0].name?document.getElementById("fileInput").files[0].name:"ExtratctedData.xlsx";
        fileName = fileName.replace(".pdf",".xlsx");
        // (C3) "FORCE DOWNLOAD" XLSX FILE
        XLSX.writeFile(workbook, fileName);
        }
    }
  })