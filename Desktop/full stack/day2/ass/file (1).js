const fs=require("fs")
fs.writeFile("index.txt","I created new file using fs module",(err)=>{
    console.log(err);
    console.log("File created successfully");
})
fs.appendFile("sample.txt","\nHello hi",(err)=>
{
    console.log(err);
    console.log("File appended successfully");
})

fs.unlink("index.txt",(err)=>{
    if(err){
        console.log(err);
    }
    console.log("File deleted successfully");
})

fs.readFile("sample.txt","utf-8",(err,data)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log(data);
    }
})