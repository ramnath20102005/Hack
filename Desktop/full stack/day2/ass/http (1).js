const http=require("http");
http.get("/getserver",(req,res)=>{
    
})
const server = http.createServer((req,res)=>
{
    console.log(req);
});
server.listen(3000,()=>{
    console.log("Server is listening on port 3000");
})