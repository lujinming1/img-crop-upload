var http = require('http');
var fs = require('fs');

const PORT = 9999;
const FRServer = http.createServer();

FRServer.on('request', (req, res) => {

   if(req.method.toLowerCase() === 'post'){
       fileParse(req, res);
   } else {
       res.end();
   }
});
function fileParse(req, res) {

    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    var body = '';
    var imgData = '';
    var imgType = '';

    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () => {
        let regex = /^data:image\/(\w+);base64,([^$]*)$/;
        regex.test(body);
        imgType = RegExp.$1;
        imgData = RegExp.$2;
        let dataBuffer = Buffer.from(imgData, 'base64');
        console.log(dataBuffer);
        fs.writeFile('ss.'+imgType, dataBuffer, (err) => {
            if(!err){
                res.end('图片上传完成');
            } else {
                res.end('图片上传失败');
            }
        })


    });

}

FRServer.listen(PORT, (err)=>{
   if(!err){
       console.log("Server running at http://localhost:" + PORT);
   }
});