const{processes,remoteRequire}=require("sdk/remote/parent");
remoteRequire("./content-policy",module);
processes.forEvery(process=>{process.port.emit("init");});