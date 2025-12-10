const path=require("path");
const basename=path.basename("D:\FullStack\Day2\sample.txt");
console.log(basename);
const extension=path.extname("D:\FullStack\Day2\sample.txt");
console.log(extension);
const joinpath=path.join("folder","subfolder","index.txt");
console.log(joinpath);c