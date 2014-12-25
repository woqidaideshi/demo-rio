var rsaKey = require('../rsaKey');
var tape = require('tape');
var fs = require('fs');
var fileTransfer = require('./fileTransfer');
var request = require('request');
var util = require('util');
var HashTable = require('hashtable');
var cryptoConf = require('../../cryptoConf');
var path = require('path');

var RATIO_SIZE = 0.1;
var transferHashTable = new HashTable();

function deleteTmpFile(tmpFilePath,callback){
  try{
    if(fs.existsSync(tmpFilePath)){
      fs.unlinkSync(tmpFilePath);
      callback(false,'deleteTmpFile success');
    }else{
      callback(false,'deleteTmpFile no need to delete');
    }
  }catch(e){
    callback(true,'deleteTmpFile '+e);
  }
}
exports.deleteTmpFile = deleteTmpFile;

function transferFileProcess(msgObj, callback) {
  rsaKey.mkdirsSync(cryptoConf.DOWNLOADPATH, function(done) {
    if (done) {
      transferFile(msgObj, callback);
    } else {
      setTimeout(callback(true, 'init transfer dir failed.....'), 0);
    }
  });
}
exports.transferFileProcess = transferFileProcess;

function initTransferFileName(fileName, callback) {
  var filePath = path.join(cryptoConf.DOWNLOADPATH, fileName);
  var name;
  var suffix;
  var i = 1;
  while (fileExistOrNot(filePath)) {
    if (i === 1) {
      if (fileName.indexOf(".") >= 0) {
        var buf = fileName.split('.');
        name = fileName.substr(0, fileName.length - buf[buf.length - 1].length - 1);
        suffix = '.' + buf[buf.length - 1];
      } else {
        name = fileName;
        suffix = '';
      }
    }
    fileName =  name + ' (' + i + ')' + suffix;
    filePath = path.join(cryptoConf.DOWNLOADPATH,fileName);
    i++;
  }
  callback(fileName,filePath);
}
exports.initTransferFileName = initTransferFileName;

function fileExistOrNot(filePath) {
  var exists = fs.existsSync(filePath);
  return exists;
}

function initTransferSaveDir(targetDir,initTransferSaveDirCb){
  rsaKey.mkdirsSync(targetDir,function(done){
    initTransferSaveDirCb(done);
  });
}
exports.initTransferSaveDir = initTransferSaveDir;

function cancelTransfer(path, callback) {
  var fileTransferStream = transferHashTable.get(path);
  if (fileTransferStream !== undefined) {
    fileTransferStream.abort();
    transferHashTable.remove(path);
  }
  callback();
}
exports.cancelTransfer = cancelTransfer;

function transferFile(msgObj, callback) {
  try {
    initTransferFileName(msgObj.fileName, function(fileName, output) {
      var run = new tape();
      run.test('can stream into a file', function(test) {
        var url = 'http://' + msgObj.ip + ':' + msgObj.filePort + '/' + msgObj.key;

        var read = request(url);
        transferHashTable.put(msgObj.key, read);
        var write = fs.createWriteStream(output);
        read.pipe(write);

        var currentRatio = 0;
        var currentLength = 0;
        var lastSendRatio = 0;
        read.on('data', function(data) {
          currentLength += data.length;
          currentRatio = currentLength / msgObj.fileLength;
          console.log('data========currentLength====msgObj.fileLength========='+currentLength+'   '+msgObj.fileLength+'  RATIO_SIZE  '+RATIO_SIZE);
          if ((currentRatio - lastSendRatio) > RATIO_SIZE && currentRatio !== 1) {
            //调用显示传输进度的函数  之后再调用client.transferFileRatio------------界面显示    
            lastSendRatio = currentRatio;
            console.log('data========currentRatio============='+currentRatio+' RATIO_SIZE  '+RATIO_SIZE);
            fileTransfer.transferFileRatio(1, msgObj, currentRatio, function(rstObj) {
              setTimeout(callback(false, rstObj), 0);
            });
          }
        });
        read.on('end', function(data) {
          test.end();
          transferHashTable.remove(msgObj.key);
          console.log('end========currentRatio============='+currentRatio);
          //调用显示传输进度的函数  之后再调用client.transferFileRatio------------界面显示
          fileTransfer.transferFileRatio(2, msgObj, currentRatio, function(rstObj) {
            setTimeout(callback(false, rstObj), 0);
          });
        });

        read.on('error', function(err) {
          test.end();
          transferHashTable.remove(msgObj.key);
          if ((err === 404 || err === 500) && fs.existsSync(output)) {
            fs.unlinkSync(output);
          }
          //调用显示传输进度的函数  之后再调用client.transferFileRatio------------界面显示
          fileTransfer.transferFileRatio(0, msgObj, currentRatio, function(rstObj) {
            setTimeout(callback(false, rstObj), 0);
          });
        });
        var filePathMsg={'initFile':1,'fileName':fileName,'filePath':output};
        setTimeout(callback(false,filePathMsg), 0);
      });
    });
  } catch (e) {
    setTimeout(callback(true, 'on fileTransfering failed.....'), 0);
  }
}
exports.transferFile = transferFile;