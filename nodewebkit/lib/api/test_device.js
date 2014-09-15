var mdns = require('./device');
function deviceStateCb(signal, args){
    var interface = args[0];
    var protocol = args[1];
    var name = args[2];
    var type = args[3];
    var domain = args[4];
    var flags = args[5];
    // console.log('deviceStateCb:', signal, args);
    switch(signal){
	    	case 'ItemNew':
	    		console.log('A new device is add, name: "'+  name + '"');
	    	break;
	    	case 'ItemRemove':
	    		console.log('A device is removed, name: "'+  name + '"');
	    	break;
    }
}

function devicePublishCb(){
    var name = 'demo-rio';
    var address = '192.168.160.176';
    var port = '80';
    var txtarray = ['demo-rio', 'hello'];
    mdns.entryGroupCommit(name, address, port, txtarray)
}

function showDeviceListCb(args){
    deviceList = args;
    console.log("\n=====device list as below=====");
    var cnt = 1;
    var obj;
    for(address in deviceList){
        obj = deviceList[address]
        var txtarray = obj.txt
        var txt = ''
        for(var i=0; i<txtarray.length; i++){
            txt += (txtarray[i] + '; ');
         }        
        console.log(obj.address + ':' + obj.port + ' - ' + '"' + obj.name + '" (' + txt + ')');
    }    
}
mdns.addDeviceListener(deviceStateCb);
mdns.setShowDeviceListCb(showDeviceListCb);
mdns.createServer(devicePublishCb);

//setTimeout(function(){
//    var name = 'demo-rio';
//    var address = '192.168.160.176';
//    var port = '80';
//    var txtarray = ['demo-rio', 'hello'];
//    mdns.entryGroupCommit(name, address, port, txtarray)
//}, 2000);

setTimeout(function(){mdns.showDeviceList()}, 2000);

setTimeout(function(){
    mdns.entryGroupReset()
}, 4000);


setTimeout(function(){mdns.showDeviceList()}, 6000);

// setTimeout(function(){mdns.createServiceBrowser()}, 200);
// setTimeout(function(){mdns.createEntryGroup}, 200);
