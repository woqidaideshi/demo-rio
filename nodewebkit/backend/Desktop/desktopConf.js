/**
 * @Copyright:
 *
 * @Description: API for desktop configuration.
 *
 * @author: Xiquan
 *
 * @Data:2014.10.13
 *
 * @version:0.1.1
 **/
var pathModule = require('path');
var fs = require('fs');
var os = require('os');
var config = require("../config");
var dataDes = require("../FilesHandle/desFilesHandle");
var resourceRepo = require("../FilesHandle/repo");
var util = require('util');
var events = require('events');
var uniqueID = require("../uniqueID");



/** 
 * @Method: initConf
 *    init desktop config dir
 *
 * @param: callback
 *    result as a json object
 **/
function initConf(callback) {
  var path = config.RESOURCEPATH + "/.desktop";
  fs.mkdir(path, function(err) {
    if (err) {
      console.log(err);
      return;
    }
    var pathApp = path + "/apllication";
    var pathDesk = path + "/desktop";
    var pathDock = path + "/dock";
    var pathTheme = path + "/Theme.conf";
    var pathWidget = path + "/Widget.conf"
    var tmp = {};
    var sItem = JSON.stringify(tmp, null, 4);
    fs.writeFile(pathTheme, sItem, function(err) {
      if (err) {
        console.log("init Theme config file error!");
        console.log(err);
      }
      callback("success_init_theme");
    });
    fs.writeFile(pathWidget, sItem, function(err) {
      if (err) {
        console.log("init Widget config file error!");
        console.log(err);
      }
      callback("success_init_Widget");
    });
    fs.mkdir(pathApp, function(err) {
      if (err) {
        console.log(err);
      }
      callback("success_app");
    });
    fs.mkdir(pathDesk, function(err) {
      if (err) {
        console.log(err);
      }
      callback("success_desk");
    });
    fs.mkdir(pathDock, function(err) {
      if (err) {
        console.log(err);
      }
      callback("success_dock");
    });
  })
}
exports.initConf = initConf;

/** 
 * @Method: readThemeConf
 *    read file Theme.conf
 *
 * @param: callback
 *    result as a json object
 **/
function readThemeConf(callback) {
  var ThemeConfPath = config.RESOURCEPATH + "/.desktop/Theme.conf";
  fs.readFile(ThemeConfPath, 'utf8', function(err, data) {
    if (err) {
      console.log("read Theme config file error!");
      console.log(err);
      return;
    } else {
      var json = JSON.parse(data);
      console.log(json);
      callback(json);
    }
  });
}
exports.readThemeConf = readThemeConf;

/** 
 * @Method: writeThemeConf
 *    modify file Theme.conf
 *
 * @param: callback
 *    Retrive "success" when success
 *
 * @param: oTheme
 *    json object, modified content of Theme.conf
 *
 **/
function writeThemeConf(callback, oTheme) {
  var sTheme = JSON.stringify(oTheme, null, 4);
  var ThemeConfPath = config.RESOURCEPATH + "/.desktop/Theme.conf";
  var path = config.RESOURCEPATH + "/.desktop";
  fs.writeFile(ThemeConfPath, sTheme, function(err) {
    if (err) {
      console.log("write Theme config file error!");
      console.log(err);
    } else {
      var currentTime = (new Date());
      config.riolog("time: " + currentTime);
      var attrs = {
        lastAccessTime: currentTime,
        lastModifyTime: currentTime,
        lastAccessDev: config.uniqueID
      }
      var chItem = ThemeConfPath;
      var itemDesPath = path.replace(/\/resources\//, '/resources/.des/');
      dataDes.updateItem(chItem, attrs, itemDesPath, function() {
        callback("success");
      });
    }
  });
}
exports.writeThemeConf = writeThemeConf;

/** 
 * @Method: readWidgetConf
 *    read file Widget.conf
 *
 * @param: callback
 *    result as a json object
 **/
function readWidgetConf(callback) {
  var WidgetConfPath = config.RESOURCEPATH + "/.desktop/Widget.conf";
  fs.readFile(WidgetConfPath, 'utf8', function(err, data) {
    if (err) {
      console.log("read Theme config file error!");
      console.log(err);
      return;
    } else {
      var oJson = JSON.parse(data);
      console.log(oJson);
      callback(oJson);
    }
  });
}
exports.readWidgetConf = readWidgetConf;

/** 
 * @Method: writeThemeConf
 *    modify file Theme.conf
 *
 * @param: callback
 *    Retrive "success" when success
 *
 * @param: oTheme
 *    json object, modified content of Widget.conf
 *
 **/
function writeWidgetConf(callback, oWidget) {
  var sWidget = JSON.stringify(oWidget, null, 4);
  var WidgetConfPath = config.RESOURCEPATH + "/.desktop/Widget.conf";
  var path = config.RESOURCEPATH + "/.desktop";
  fs.writeFile(WidgetConfPath, sWidget, function(err) {
    if (err) {
      console.log("write Widget config file error!");
      console.log(err);
    } else {
      var currentTime = (new Date());
      config.riolog("time: " + currentTime);
      var attrs = {
        lastAccessTime: currentTime,
        lastModifyTime: currentTime,
        lastAccessDev: config.uniqueID
      }
      var chItem = WidgetConfPath;
      var itemDesPath = path.replace(/\/resources\//, '/resources/.des/');
      dataDes.updateItem(chItem, attrs, itemDesPath, function() {
        callback("success");
      });
    }
  });
}
exports.writeWidgetConf = writeWidgetConf;

/** 
 * @Method: readDesktopEntries
 *    read file Widget.conf
 *
 * @param1: callback
 *    result as a json object
 *
 * @param2: fileName
 *    name of target file
 *
 **/
function readDesktopEntries(callback, sFileName) {
  var sPath = config.RESOURCEPATH + "/.des/.desktop/application/" + sFileName;

  function parseDesktopFileCb(attr) {
    callback(attr);
  }
  parseDesktopFile(sPath, parseDesktopFileCb);
}
exports.readDesktopEntries = readDesktopEntries;

/** 
 * @Method: parseDesktopFile
 *    parse Desktop File into json object
 *
 * @param1: sPath
 *    taget .desktop file path
 *
 * @param2: callback
 *    result in json object
 *
 **/
function parseDesktopFile(sPath, callback) {
  if (typeof callback !== 'function')
    throw 'Bad type of callback!!';

  fs.readFile(sPath, 'utf-8', function(err, data) {
    if (err) {
      console.log("read desktop file error");
      console.log(err);
      return;
    } else {
      data = data.replace(/[\[]{1}[a-z, ,A-Z]*\]{1}\n/g, '$').split('$');
      var lines = data[1].split('\n');
      var attr = [];
      for (var i = 0; i < lines.length - 1; ++i) {
        var tmp = lines[i].split('=');
        attr[tmp[0]] = tmp[1];
        for (var j = 2; j < tmp.length; j++)
          attr[tmp[0]] += '=' + tmp[j];
      }
      console.log("Get desktop file successfully");
      callback(attr);
    }
  });
}