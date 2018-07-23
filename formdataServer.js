var http = require('http');
var fs = require('fs');
var util = require('util');
var querystring = require('querystring');


const PORT = 8888;

const formdataServer = http.createServer();

formdataServer.on('request', (req, res) =>{

    if(req.method.toLowerCase() === 'post'){
        if(req.headers['content-type'].indexOf('multipart/form-data') !== -1){
            parseFile(req,res);
        } else {
            res.end('其他方式提交');
        }
    }

});

function parseFile(req, res){
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    req.setEncoding('binary');  // 一定要设置response的编码为binary否则会图片打不开

    var body = '';
    var fileName = '';

    var boundary = req.headers['content-type'].split(';')[1].replace(' boundary=','');

    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () =>{
        var file = querystring.parse(body, '\r\n', ":");
        if(file['Content-Type'].indexOf('image') !== -1){
            var fileInfo = file['Content-Disposition'].split(';');
            for(var index in fileInfo){
                if(fileInfo[index].indexOf('filename=') !== -1){
                    fileName = fileInfo[index].substring(11, fileInfo[index].length-1);
                }
            }
            var entireData = body.toString();
            var contentTypeRegx = /Content-Type: image\/.* /;
            var contentType = file['Content-Type'].substring(1);

            var upperBoundary = entireData.indexOf(contentType) + contentType.length;

            var shorterData = entireData.substring(upperBoundary);


            var binaryDataAlmost = shorterData.replace(/^\s\s*/, '').replace(/\s\s*$/,'');

            var binaryData = binaryDataAlmost.substring(0, binaryDataAlmost.indexOf('--'+boundary+'--'));


            fs.writeFile(fileName, binaryData, 'binary', (err) => {
                console.log(err);
                res.end('图片上传完成');
            })
        }else{
            res.end('只能上传图片');
        }
    })

}



formdataServer.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});

