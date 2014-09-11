



//API getAllDataByCate:查询某基本分类下的所有数据,此方法不能用来查看联系人分类
//图片视频等返回data型array：
//data{
//  id;
//  filename;
//  postfix:;
//  path;
//}
//联系人返回contacts类型array：
//contacts{
//  id;
//  name;
//  photoPath;
//}

function getAllDataByCate(getAllDataByCateCb,cate) {
  console.log("Request handler 'getAllDataByCate' was called.");
  if(cate!='Contacts' && cate!='Videos' && cate!='Pictures' &&cate!='Documents'&&cate!='Music')
  {
      console.log("cate "+cate+" is an error cate");
      return ;
  }
  if(isLocal())  {
    console.log('You are in local ');
    var apiLocalHandle = require("./backend/apiLocalHandle");
    if(cate=='Contacts'){
      apiLocalHandle.getAllContactsFromLocal(getAllDataByCateCb);
    }
    else{
      apiLocalHandle.getAllDataByCateFromLocal(getAllDataByCateCb,cate);
    }
    
  }else{
    console.log('You are in remote ');
    if(cate=='Contacts'){
      getAllContactsFromHttp(getAllDataByCateCb);
    }
    else{
      getAllDataByCateFromHttp(getAllDataByCateCb,cate);
    }
  }
}


//API rmDataByUri:通过uri删除数据
//返回字符串：
//成功返回success;
//失败返回失败原因
function rmDataByUri(rmDataByUriCb,uri) {
  console.log("Request handler 'getAllDataByCate' was called.");
  if(isLocal())  {
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.rmDataByUriFromLocal(rmDataByUriCb,uri);
  }
  else{
    console.log('You are in remote ');
    rmDataByUriFromHttp(rmDataByUriCb,uri);
  }
}

//API getDataByUri:通过uri查看数据所有信息
//返回具体数据类型对象
function getDataByUri(getDataByUriCb,uri){
  console.log("Request handler 'getDataByUri' was called.");
  if(isLocal())  {
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.getDataByUriFromLocal(getDataByUriCb,uri);
  }else{
    console.log('You are in remote '); 
    getDataByUriFromHttp(getDataByUriCb,uri);
  }
}

//API getDataSourceById:通过id获取数据资源地址
//返回类型：
//result{
//  openmethod;//三个值：'direct'表示直接通过http访问;'remote'表示通过VNC远程访问;'local'表示直接在本地打开
//  content;//如果openmethod是'direct'或者'local'，则表示路径; 如果openmethod是'remote'，则表示端口号
//}

function getDataSourceByUri(getDataSourceByUriCb,uri){
  console.log("Request handler 'getDataSourceById' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.getDataSourceByUriFromLocal(getDataSourceByUriCb,uri);
  }
  else{
    console.log('You are in remote '); 
    getDataSourceByUriFromHttp(getDataSourceByUriCb,uri);
  }
}

//API updateItemValue:修改数据某一个属性
//返回类型：
//成功返回success;
//失败返回失败原因

function updateDataValue(updateDataValueCb,uri,version,item){
  console.log("Request handler 'updateDataValue' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.updateDataValueFromLocal(updateDataValueCb,uri,version,item);
  }
  else{
    console.log('You are in remote '); 
    updateDataValueFromHttp(updateDataValueCb,uri,version,item);
  }
}

//API getRecentAccessData:获得最近访问数据的信息
//返回类型：
//返回具体数据类型对象数组

function getRecentAccessData(getRecentAccessDataCb,num){
  console.log("Request handler 'updateItemValue' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.getRecentAccessDataFromLocal(getRecentAccessDataCb,num);
  }
  else{
    console.log('You are in remote '); 
    getRecentAccessDataFromHttp(getRecentAccessDataCb,num);
  }
}

//API getServerAddress:获得最近访问数据的信息
//返回类型：
//返回具体数据类型对象数组

function getServerAddress(getServerAddressCb){
  console.log("Request handler 'getServerAddress' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.getServerAddressFromLocal(getServerAddressCb);
  }
  else{
    console.log('You are in remote '); 
    getServerAddressFromHttp(getServerAddressCb);
  }
}

//API gileSend
function fileSend(host){
  console.log("Request handler 'fileSend' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.sendFileFromLocal(host);
  }
  else{
    console.log('You are in remote '); 
    sendFileFromHttp(host);
    //
  }
}

//API fileReceiver
function fileReceive(path){
  console.log("Request handler 'fileSend' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.receiveFileFromLocal(path);
  }
  else{
    console.log('You are in remote '); 
    receiveFileFromHttp(path);
    //
  }
}

//API getDeviceDiscoveryService:使用设备发现服务
//参数分别为设备发现和设备离开的回调函数
var SOCKETIOPORT=8891;
function getDeviceDiscoveryService(deviceUpCb,deviceDownCb){
  console.log("Request handler 'getDeviceDiscoveryService' was called.");
  function getServerAddressCb(result){
    var add='ws://'+result.ip+':'+SOCKETIOPORT+'/';
    var socket = io.connect(add);  
    socket.on('mdnsUp', function (data) { //接收来自服务器的 名字叫server的数据
      deviceUpCb(data);
    });
    socket.on('mdnsDown', function (data) { //接收来自服务器的 名字叫server的数据
      deviceDownCb(data);
    });
  }
  getServerAddress(getServerAddressCb);
}

//API getDataDir:获取数据路径
function getDataDir(getDataDirCb){
  console.log("Request handler 'getDataDir' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var apiLocalHandle = require("./backend/apiLocalHandle");
    apiLocalHandle.getDataDirFromLocal(getDataDirCb);
  }
  else{
    console.log('You are in remote '); 
    getDataDirFromHttp(getDataDirCb);
  }
}

/*
//API demoDataSync
function demoDataSync(deviceName,deviceId,deviceAddress){
  console.log("Start demoDataSync !");
  function getServerAddressCb(result){
    var add='ws://'+result.ip+':'+SOCKETIOPORT+'/';
    var socket = io.connect(add);  
    socket.on('mdnsUp', function (data) { //接收来自服务器的 名字叫server的数据
      deviceUpCb(data);
      var dataSync =  require("./backend/DataSync.js");
      dataSync.syncRequest(deviceName,deviceId,deviceAddress);
    });
    socket.on('mdnsDown', function (data) { //接收来自服务器的 名字叫server的数据
      deviceDownCb(data);
    });
  }
  getServerAddress(getServerAddressCb);
}*/

//API repoMergeForFirstTime:获取remote repo
function repoMergeForFirstTime(name,branch,address,path){
  console.log("Request handler 'repoMergeForFirstTime' was called.");
  if(isLocal()){     
    console.log('You are in local '); 
    var repo = require("./backend/repo");
    repo.repoMergeForFirstTime(name,branch,address,path);
  }
  else{
    console.log('You are in remote '); 
  }
}
