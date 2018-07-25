var http = require('http');
var fs = require('fs');

const PORT = 8888;

const formDataServer = http.createServer();

formDataServer.on('request', (req, res) =>{

    if(req.method.toLowerCase() === 'post'){
        if(req.headers['content-type'].indexOf('multipart/form-data') !== -1){
            parseFile(req,res);
        } else {
            res.end('其他方式提交');
        }
    } else {
        sendHTML(req, res);
    }

});

function parseFile(req, res){
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    req.setEncoding('binary');  // 一定要设置response的编码为binary否则会图片打不开

    let body = '';
    let fileName = '';

    let boundary = req.headers['content-type'].split(';')[1].replace(' boundary=','');

    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () =>{
        let fileNameReg = /filename="([^"]*)"/;
        let fileTypeReg = /(image\/([^\s]*)\s)/;
        let fileType = null;
        let contentType = null;
        if(fileNameReg.test(body)){
            fileName = RegExp.$1;
        }
        if(fileTypeReg.test(body)){
            contentType = RegExp.$1;
            fileType = RegExp.$2;
        }

        if(fileType){

            let upperBoundary = body.indexOf(contentType) + contentType.length;
            let shorterData = body.slice(upperBoundary, -1 * ('--'+boundary+'--').length);
            let imageData = shorterData.replace(/^\s\s*/, '');

            fs.writeFile(fileName, imageData, 'binary', (err) => {
                if(err){
                    res.end('图片上传失败');
                } else{
                    res.end('图片上传完成');
                }
            })
        }else{
            res.end('只能上传图片');
        }
    })

}

function sendHTML(req, res){
    res.setHeader('Content-Type', 'text/html,charset=utf-8');
    let readStream = fs.createReadStream('./img_upload.html');
    readStream.pipe(res);
    readStream.on('end', (err) => {
        if(err){
            console.log(err);
        }
        res.end();
    })

}



formDataServer.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});

