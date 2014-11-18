var commonDAO = require("../commonHandle/CommonDAO");
var msgTransfer = require("../Transfer/msgTransfer");
var config = require("../config");
var ds = require("../../lib/api/device_service");

var devicesList=new Array();
exports.devicesList = devicesList;

var USER_ACCOUNT = "v1";

function getDeviceList(){
  commonDAO.findItems(null,["devices"],null,null,function(err,items){
    if(err){
      console.log(err);  
    }
    else{
      items.forEach(function(item){
        item.online=false;
        item.sync=false;
        devicesList[item.device_id]=item;
      });
      console.log("----------------------devicesList:-----------------------");
      for (var i in devicesList) {  
        console.log(devicesList[i]);
      }  
      console.log("---------------------------------------------------------");
    }
  });
}
exports.getDeviceList = getDeviceList;

//API getServerAddress:获得最近访问数据的信息
//返回类型：
//返回具体数据类型对象数组
function getServerAddress(getServerAddressCb){
  console.log("Request handler 'getServerAddress' was called.");
  var address={
    ip:config.SERVERIP,
    port:config.SERVERPORT
  };
  getServerAddressCb(address);
}
exports.getServerAddress = getServerAddress;

function addDevice(device){
  if(device.device_id in devicesList){
    devicesList[device.device_id].online=true;
    devicesList[device.device_id].sync=false;
    var changeAttr={};
    var changeFlag=0;
    for(var attr in device){
      if(devicesList[device.device_id][attr]!=device[attr]){
        console.log("change "+attr+" to "+device[attr]);
        devicesList[device.device_id][attr]=device[attr];
        changeAttr[attr]=device[attr];
        changeFlag=1;
      }
    }
    if(changeFlag==1){
      changeAttr.conditions=["device_id='"+device.device_id+"'"];
      changeAttr.category="devices";
      console.log(changeAttr);
      commonDAO.updateItem(changeAttr,function(result){
        console.log(result);
      });
    }
    /*console.log("OLD device");
    console.log("----------------------devicesList:-----------------------");
    for (var i in devicesList) {  
      console.log(devicesList[i]);
    }  
    console.log("**********************************************************");*/
  }
  else{
    console.log("NEW device");
    device.category = "devices";
    commonDAO.createItem(device,function(result){
      device.online=true;
      device.sync=false;
      devicesList[device.device_id]=device;
      /*console.log("----------------------devicesList:-----------------------");
      for (var i in devicesList) {  
        console.log(devicesList[i]);
      }  
      console.log("**********************************************************");*/
    });
  }
}
exports.addDevice = addDevice;

function rmDevice(device){
  console.log("device.device_id:"+device.device_id);
  console.log("devicesList[device.device_id]:");
  console.log(devicesList[device.device_id]);
  if(devicesList[device.device_id].online==undefined){
    return;
  }
  devicesList[device.device_id].online=false;
  if(devicesList[device.device_id].sync==undefined){
    return;
  }
  devicesList[device.device_id].sync=false;
  /*console.log("----------------------devicesList:-----------------------");
  for (var i in devicesList) {  
    console.log(devicesList[i]);
  }  
  console.log("**********************************************************");*/
}
exports.addDevice = addDevice;

/**
 * @method listenDeviceCallback
 *    Callback for device linstener.
 * @param callback
 *    This callback.
 */
function listenDeviceCallback(deviceObj){
  if(deviceObj.flag === "up"){
    console.log("device up:", deviceObj);
  }
  if(deviceObj.flag === "down"){
    console.log("device down:", deviceObj);
  }
}

function startDeviceDiscoveryService(){
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$start Device Discovery Service ");
  getDeviceList();
  ds.addListenerByAccount(listenDeviceCallback, USER_ACCOUNT);
  /*mdns.addDeviceListener(function (signal, args){
    if(args==null || args.txt==null){
      return;
    }
    if(args.txt[0]=="demo-rio"){
      var device={
        device_id:args.txt[1],
        name:args.txt[2],
        resourcePath:args.txt[3],
        ip:args.txt[4],
        account:args.txt[5]
      };
      switch(signal){
        case 'ItemNew':{
          addDevice(device);
          msgTransfer.serviceUp(device);
        }       
        break;
        case 'ItemRemove':{
          //socket.emit('mdnsDown', args);
          console.log(args);  
          rmDevice(device);        
        }
        break;
      }
    }
  });*/
  //Start device service
  ds.startMdnsService(function(state) {
    if (state === true) {
      console.log('start MDNS service successful!');
    };
  });
  /*mdns.createServer(function(){
    var name = config.SERVERNAME;
    var port = config.MDNSPORT;
    var txtarray = ["demo-rio",config.uniqueID,config.SERVERNAME,config.RESOURCEPATH,config.SERVERIP,config.ACCOUNT];
      console.log("************************************");
      console.log(txtarray);
            console.log("************************************");
    mdns.entryGroupCommit(name,  port, txtarray);
  });*/
}
exports.startDeviceDiscoveryService = startDeviceDiscoveryService;
