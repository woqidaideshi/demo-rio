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
var fs = require('../fixed_fs');
var fs_extra = require('fs-extra');
var Q = require('q');
var os = require('os');
var config = require('systemconfig');
var commonHandle = require("../commonHandle/commonHandle");
var typeHandle = require("../commonHandle/typeHandle");
/*TODO: some old depenent should be rewrite in future*/
var commonDAO = null;
var tagsHandle = require("../commonHandle/tagsHandle");
var promised = require('../commonHandle/promisedFunc');
var utils = require('../utils');
var uniqueID = require("../uniqueID");
var exec = require('child_process').exec;

//@const
var CATEGORY_NAME = "desktop";
var REAL_REPO_DIR = pathModule.join(config.RESOURCEPATH, CATEGORY_NAME);
var REAL_DIR = pathModule.join(config.RESOURCEPATH, CATEGORY_NAME, 'data');
var REAL_APP_DIR = pathModule.join(REAL_DIR, 'applications');
var THEME_PATH = pathModule.join(REAL_DIR, 'Theme.conf');
var WIGDET_PATH = pathModule.join(REAL_DIR, 'Widget.conf');
var RESOURCEPATH = config.RESOURCEPATH;
var CONFIG_PATH = pathModule.join(config.RESOURCEPATH, "desktop");
var DESKTAG = "$desktop$"

function getnit(initType) {
  if (initType === "theme") {
    var _icontheme = {};
    _icontheme.name = 'Mint-X';
    _icontheme.active = false;
    _icontheme.pos = {};

    var _computer = {};
    _computer.name = '我的电脑';
    _computer.active = true;
    _computer.icon = 'computer';
    _computer.path = '$HOME';
    _computer.id = 'computer';
    _computer.idx = 0;
    _computer.pos = {};

    var _trash = {};
    _trash.name = 'Trash';
    _trash.active = false;
    _trash.pos = {};

    var _network = {};
    _network.name = 'Network';
    _network.active = false;
    _network.pos = {};

    var _document = {};
    _document.name = 'Document';
    _document.active = false;
    _document.pos = {};

    var result = {
      icontheme: _icontheme,
      computer: _computer,
      trash: _trash,
      network: _network,
      document: _document
    }
  } else if (initType === "widget") {
    var _clock = {};
    _clock.id = 'clock';
    _clock.path = 'img/clock.png';
    _clock.type = 'ClockPlugin';
    _clock.position = {
      x: 0,
      y: 0
    }
    var _datamgr_app = {}
    _datamgr_app.id = "datamgr-app";
    _datamgr_app.path = 'demo-rio/datamgr'; //change 'WORK_DIRECTORY' into local.
    _datamgr_app.iconPath = 'icons/datamgr.png';
    _datamgr_app.name = "数据管理器";
    _datamgr_app.type = "inside-app";

    var _launcher_app = {}
    _launcher_app.id = "launcher-app";
    _launcher_app.path = "demo-webde/nw";
    _launcher_app.iconPath = "img/launcher.png";
    _launcher_app.name = "应用启动器";
    _launcher_app.type = "inside-app";
    _launcher_app.idx = 0;

    var _login_app = {}
    _login_app.id = "login-app";
    _login_app.path = "demo-webde/nw";
    _login_app.iconPath = "img/Login-icon.png";
    _login_app.name = "登录";
    _login_app.type = "inside-app";
    _login_app.idx = 1;

    var _flash_app = {}
    _flash_app.id = "flash-app";
    _flash_app.path = "demo-webde/nw/app/flash";
    _flash_app.iconPath = "img/video.png";
    _flash_app.name = "视频播放器";
    _flash_app.type = "inside-app";
    _flash_app.idx = 2;


    var _test_app = {}
    _test_app.id = "test-app";
    _test_app.path = "demo-webde/nw/app/test-app";
    _test_app.iconPath = "img/test-app2.png";
    _test_app.name = "新浪NBA";
    _test_app.type = "inside-app";
    _test_app.idx = -1;

    var _wiki_app = {}
    _wiki_app.id = "wiki-app";
    _wiki_app.path = "demo-webde/nw/app/wiki-app";
    _wiki_app.iconPath = "img/icon.jpg";
    _wiki_app.name = "维基百科";
    _wiki_app.type = "inside-app";
    _wiki_app.idx = -1;

    var result = {}
    result.layout = {
      "type": "grid",
      "num": 3,
      "main": 0,
      "widget": [{
        "plugin": {
          "clock": _clock
        },
        "dentry": {},
        "insideApp": {
          "datamgr-app": _datamgr_app,
          "launcher-app": _launcher_app,
          "login-app": _login_app,
          "flash-app": _flash_app,
        }
      }, {
        "insideApp": {
          "test-app": _test_app
        },
        "plugin": {},
        "dentry": {}
      }, {
        "insideApp": {
          "wiki-app": _wiki_app
        },
        "plugin": {},
        "dentry": {}
      }]
    }
    result.dock = {
      "launcher-app": _launcher_app,
      "login-app": _login_app
    }
  }
  return result;
}


function initDesktop() {
  var systemType = os.type();
  var path = REAL_DIR;
  var pathDesk = path + "/desktop";
  var pathDock = path + "/dock";
  var pathApp = path + "/applications";
  return promised.ensure_dir(path)
    .then(function() {
      return promised.ensure_dir(pathDesk);
    })
    .then(function() {
      return promised.ensure_dir(pathDock);
    })
    .then(function() {
      return promised.ensure_dir(pathApp);
    })
    .then(function() {
      return promised.ensure_dir(config.APP_DATA_PATH[0]);
    })
    .then(function() {
      return buildConfFile();
    })
    .then(function() {
      return buildDesktopInfo();
    })
}
exports.initDesktop = initDesktop;

function buildConfFile() {
  var tmpThemw = getnit("theme");
  var tmpWidget = getnit("widget");
  var pathTheme = pathModule.join(REAL_DIR, "Theme.conf");
  var pathWidget = pathModule.join(REAL_DIR, "Widget.conf");
  var sItemTheme = JSON.stringify(tmpThemw, null, 4);
  var sItemWidget = JSON.stringify(tmpWidget, null, 4);
  return promised.open(pathTheme, 'r')
    .then(function(fd_) {
      return promised.close(fd_);
    }, function(err) {
      return promised.output_file(pathTheme, sItemTheme)
        .then(function() {
          return promised.output_file(pathWidget, sItemWidget);
        });
    });
}

function buildDesktopInfo() {
  return buildLocalDesktopFile()
    .then(function() {
      return buildAppMethodInfo('defaults.list');
    })
    .then(function() {
      return buildAppMethodInfo('mimeinfo.cache');
    })
}


/** 
 * @Method: readJSONFile
 *    read a json file, so far including *.conf, *.list, *.cache in local
 *
 * @param: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                read error  : "read Theme config file error!"
 *
 *    @param2: result,
 *        object, the result in object
 *
 *
 **/
function readJSONFile(filePath) {
  return promised.read_file(filePath, 'utf8')
    .then(function(file_content_) {
      return JSON.parse(file_content_);
    })
}


/** 
 * @Method: readThemeConf
 *    read file Theme.conf
 *
 * @param: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                read error  : "read Theme config file error!"
 *
 *    @param2: result,
 *        object, the result in object
 *
 *
 **/
function writeJSONFile(filePath, newContent) {
  var _str_content = JSON.stringify(newContent);
  return promised.write_file(filePath, _str_content);
}

/** 
 * @Method: readConf
 *    read file Widget.conf
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error info.
 *
 *    @param2: result,
 *        object, the result in object
 *
 *    result example:
 *    {
 *       "icontheme": {
 *           "name": "Mint-X",
 *           "active": true,
 *           "icon": null,
 *           "path": "$HOME",
 *           "id": "computer",
 *           "pos": {
 *               "x": null,
 *               "y": null
 *           }
 *       },
 *     "computer": {
 *           ...
 *           }
 *          ...
 *    }
 *
 *  @param2: sFileName
 *    string, a short file name.
 *            for now we only have 2 type: 'Theme.conf', 'Widget.conf'.
 *
 *
 **/
function readConf(filename) {
  var _list = {
    'Theme.conf': THEME_PATH,
    'Widget.conf': WIGDET_PATH,
    'Default.conf': config.BEFORELOGIN
  }
  var _file_path = _list[filename];
  return readJSONFile(_file_path);
}

function readConf_node(callback, filename) {
  return readConf(filename)
    .then(function(result) {
      callback(null, result);
    })
    .fail(function(err) {
      callback(err);
    });
}

/** 
 * @Method: writeConf
 *    modify a file .conf
 *
 * @param: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error info.
 *
 *    @param2: result,
 *        object, the result in object
 *
 *    result example:
 *    {
 *       "icontheme": {
 *           "name": "Mint-X",
 *           "active": true,
 *           "icon": null,
 *           "path": "$HOME",
 *           "id": "computer",
 *           "pos": {
 *               "x": null,
 *               "y": null
 *           }
 *       },
 *     "computer": {
 *           ...
 *           }
 *          ...
 *    }
 *
 **/
function writeConf(sFileName, oContent) {
  var _options = {
    'Theme.conf': THEME_PATH,
    'Widget.conf': WIGDET_PATH
  }
  var sFileDir = _options[sFileName];
  return writeJSONFile(sFileDir, oContent);
}


/** 
 * @Method: readAppMethod
 *    read .list/.cache file
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain a specific error info.
 *
 *    @param2: result,
 *        object, the result in json object.
 *         (see object example above in comment of buildAppMethodInfo())
 *
 *  @param2: sFileName
 *     string, a short file name as "defaults.list".
 *
 *
 **/
function readAppMethod(sFileName) {
  var sFilePath = pathModule.join(REAL_APP_DIR, sFileName);
  return readJSONFile(sFilePath);
}

/** 
 * @Method: readDesktopFile
 *   find a desktop file with name of sFilename
 *   exmple: var sFileName = 'cinnamon';
 *
 * @param: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                read error  : "readDesktopFile : desktop file NOT FOUND!"
 *                parse file error : "readDesktopFile : parse desktop file error!"
 *
 *    result example:
 *  {
 *
 *    [Desktop Entry]:{
 *        Type: Application
 *        Name: Cinnamon
 *        Comment: Window management and application launching
 *        Exec: /usr/bin / cinnamon - launcher
 *        X - GNOME - Bugzilla - Bugzilla: GNOME
 *        X - GNOME - Bugzilla - Product: cinnamon
 *        X - GNOME - Bugzilla - Component: general
 *        X - GNOME - Bugzilla - Version: 1.8.8
 *        Categories: GNOME;GTK;System;Core;
 *        OnlyShowIn: GNOME;
 *        NoDisplay: true
 *        X - GNOME - Autostart - Phase: WindowManager
 *        X - GNOME - Provides: panel;windowmanager;
 *        X - GNOME - Autostart - Notify: true
 *        X - GNOME - AutoRestart: true
 *    },
 *    [Desktop Action Compose]:{
 *              ...
 *    }
 *          ...
 *  }
 *
 * @param2: sFileName
 *    string,name of target file ,postfix is required
 *    example: var sFileName = 'cinnamon.desktop';
 *
 **/
function readDesktopFile(sFileName) {
  return findDesktopFile(sFileName)
    .then(function(file_content_) {
      return parseDesktopFile(file_content_);
    });
}


/** 
 * @Method: parseDesktopFile
 *    parse Desktop File into json object
 *
 * @param: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                parse file error : "parseDesktopFile : read desktop file error"
 *                entry match error : "parseDesktopFile : desktop file entries not match!";
 *
 *    @param2: result
 *        object,
 *
 *    result example:
 *  {
 *
 *    [Desktop Entry]:{
 *        Type: Application
 *        Name: Cinnamon
 *        Comment: Window management and application launching
 *        Exec: /usr/bin / cinnamon - launcher
 *        X - GNOME - Bugzilla - Bugzilla: GNOME
 *        X - GNOME - Bugzilla - Product: cinnamon
 *        X - GNOME - Bugzilla - Component: general
 *        X - GNOME - Bugzilla - Version: 1.8.8
 *        Categories: GNOME;GTK;System;Core;
 *        OnlyShowIn: GNOME;
 *        NoDisplay: true
 *        X - GNOME - Autostart - Phase: WindowManager
 *        X - GNOME - Provides: panel;windowmanager;
 *        X - GNOME - Autostart - Notify: true
 *        X - GNOME - AutoRestart: true
 *    },
 *    [Desktop Action Compose]:{
 *              ...
 *    }
 *          ...
 *  }
 *
 *
 **/
function parseDesktopFile(file_content_) {
  var re_head = /\[{1}[a-z,\s,A-Z,\d,\-]*\]{1}[\r,\n, ]{1}/g; //match all string like [***]
  var re_rn = /\n|\r|\r\n/g
  var re_comment = new RegExp('#');
  var re_letter = /\w/i;
  var re_eq = new RegExp('=');
  var desktopHeads = [];
  var oAllDesktop = {};
  try {
    file_content_ = file_content_.replace(re_head, function() {
      var headEntry = (RegExp.lastMatch).toString();
      headEntry = headEntry.replace(re_rn, "");
      desktopHeads.push(headEntry); //once get a match, strore it
      return "$";
    })
    file_content_ = file_content_.split('$');
    if (re_comment.test(file_content_[0]) || !re_letter.test(file_content_[0])) {
      file_content_.shift(); //the first element is a "" or has #, remove it
    }
  } catch (err_inner) {
    console.log(err_inner);
    var _err = new Error();
    _err.name = 'headEntry';
    _err.message = headEntry;
    throw _err;
  }
  if (desktopHeads.length === file_content_.length) {
    for (var i = 0; i < file_content_.length; i++) {
      if (!re_letter.test(file_content_[i])) {
        continue;
      }
      try {
        var lines = file_content_[i].split('\n');
      } catch (err_inner) {
        console.log(err_inner);
        var _err = new Error();
        _err.name = 'headContent';
        _err.message = file_content_[i];
        throw _err;
      }
      var attr = {};
      for (var j = 0; j < lines.length; ++j) {
        if (re_comment.test(lines[j]) || !re_eq.test(lines[j])) {
          continue;
        } else {
          try {
            var tmp = lines[j].split('=');
            attr[tmp[0]] = tmp[1].replace(re_rn, "");
          } catch (err_inner) {
            console.log(err_inner);
            var _err = new Error();
            _err.name = 'contentSplit';
            _err.message = tmp;
            console.log(test)
            throw _err;
          }
          for (var k = 2; k < tmp.length; k++) {
            try {
              attr[tmp[0]] += '=' + tmp[k].replace(re_rn, "");
            } catch (err_inner) {
              console.log(err_inner);
              var _err = new Error();
              _err.name = 'contentAddition';
              _err.message = tmp;
              throw _err;
            }
          }
        }
      }
      oAllDesktop[desktopHeads[i]] = attr;
    }
    if (oAllDesktop == undefined) {
      var _err = new Error("empty desktop content ...");
      throw _err;
    } else {
      return oAllDesktop;
    }
  } else {
    var _err = new Error("parseDesktopFile : desktop file entries not match!");
    throw _err;
  }
}


/** 
 * @Method: deParseDesktopFile
 *    To deparse a Desktop File json object back into a .desktop file. The input
 *    object should contain complete information of this file
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                input error : "deParseDesktopFile : input is not an object!"
 *                input error : "deParseDesktopFile : input is empty!"
 *
 *    @param2: result
 *        string, the result is in string good for fs.writeFile() to write back
 *                .desktop file.
 *
 * @param2: oDesktop
 *    object, this object should contain complete info of it's .desktop file
 *
 *    object example:
 *  {
 *
 *    [Desktop Entry]:{
 *        Type: Application
 *        Name: Cinnamon
 *        Comment: Window management and application launching
 *        Exec: /usr/bin / cinnamon - launcher
 *        X - GNOME - Bugzilla - Bugzilla: GNOME
 *        X - GNOME - Bugzilla - Product: cinnamon
 *        X - GNOME - Bugzilla - Component: general
 *        X - GNOME - Bugzilla - Version: 1.8.8
 *        Categories: GNOME;GTK;System;Core;
 *        OnlyShowIn: GNOME;
 *        NoDisplay: true
 *        X - GNOME - Autostart - Phase: WindowManager
 *        X - GNOME - Provides: panel;windowmanager;
 *        X - GNOME - Autostart - Notify: true
 *        X - GNOME - AutoRestart: true
 *    },
 *    [Desktop Action Compose]:{
 *              ...
 *    }
 *          ...
 *  }
 *
 *
 **/
function deParseDesktopFile(oDesktop) {
  if (typeof oDesktop !== 'object') {
    console.log("error : oDesktop is not an object!");
    var _err = "deParseDesktopFile : input is not an object!";
    throw new Error(_err);
  } else if (oDesktop === {}) {
    console.log("error : oDesktop is empty!");
    var _err = "deParseDesktopFile : input is empty!";
    throw new Error(_err);
  } else {
    var sDesktop = "";
    for (var head in oDesktop) {
      sDesktop = sDesktop + head + '\n';
      var oContent = oDesktop[head];
      for (var entry in oContent) {
        var sEntry = entry + '=' + oContent[entry] + '\n';
        sDesktop = sDesktop + sEntry;
      }
      sDesktop = sDesktop + '\n';
    }
    return sDesktop;
  }
}


/** 
 * @Method: findDesktopFile
 *    To find a desktop file with name of sFilename. Since we maintain all .des-
 *    -ktopfile here, the searching path would be /.desktop/applications.
 *
 * @param1: callback
 *    @result
 *    string, a full path string,
 *            as: '/usr/share/applications/cinnamon.desktop'
 *
 * @param2: sFileName
 *    string, a short file name, a posfix is reauqired
 *    exmple: var sFileName = 'cinnamon.desktop';
 *
 **/
function findDesktopFile(filename) {
  var xdgDataDir = [];
  var sAppPath = pathModule.join(REAL_DIR, 'applications', filename);
  return promised.read_file(sAppPath, 'utf-8');
}


/** 
 * @Method: deParseListFile
 *    To transe a .list/.cache file into a json object. The result would store
 *    in the object output
 *
 *  @param1: output
 *    object, this input object stores the reulst for multiple use.
 *
 * @param1: filepath
 *    string, a full path string,
 *            as: '/usr/share/applications/defaults.list'
 *
 * @param2: callabck
 *    callback without return anything
 *
 **/
function deParseListFile(file_content_) {
  var _result = {};
  file_content_ = file_content_.toString();
  var data_ = file_content_.split('\n');
  data_.shift();
  for (var i = 0; i < data_.length; i++) {
    var item = data_[i];
    if (item !== '') {
      try {
        item = item.split('/');
      } catch (err_inner) {
        var _err = new Error();
        _err.name = 'dataEntry';
        _err.message = item;
        throw _err;
      }
      var entry_fir = item[0];
      var content_fir = item[1];
      try {
        content_fir = content_fir.split('=');
      } catch (_err) {
        var _err = new Error();
        _err.name = 'content_fir';
        _err.message = content_fir;
        console.log(_err)
        throw _err;
      }
      var entry_sec = content_fir[0];
      var content_sec = content_fir[1];
      try {
        content_sec = content_sec.split(';');
      } catch (_err) {
        var _err = new Error();
        _err.name = 'content_sec';
        _err.message = content_sec;
        throw _err;
      }
      try {
        if (content_sec[content_sec.length - 1] == '') {
          content_sec.pop();
        }
      } catch (_err) {
        var _err = new Error();
        _err.name = 'content_sec'
        _err.message = content_sec;
        throw _err;
      }
      if (!_result[entry_fir]) {
        _result[entry_fir] = {};
        _result[entry_fir][entry_sec] = content_sec;
      } else if (!_result[entry_fir][entry_sec]) {
        _result[entry_fir][entry_sec] = content_sec;
      } else {
        for (var j = 0; j < content_sec.length; j++) {
          var content_sec_ = content_sec[j];
          if (!utils.isExist(content_sec_, _result[entry_fir][entry_sec])) {
            _result[entry_fir][entry_sec].push(content_sec_);
          }
        }
      }
    }
  }
  return _result;
}

/** 
 * @Method: buildAppMethodInfo
 *    To write a .list/.cache file into a json file. File name would remain at
 *    and the file content would a in json.
 *
 *    content example as below:
 *
 *    {
 *     "application": {
 *        "glade-3.desktop": [
 *          "x-glade"
 *        ],
 *        "gnumeric.desktop": [
 *          "x-gnumeric"
 *        ]
 *      },
 *      "image": {
 *
 *        "totem.desktop": [
 *          "vnd.rn-realpix"
 *        ],
 *        "gimp.desktop": [
 *          "x-psd"
 *        ]
 *      },
 *      "inode": {
 *        "nemo.desktop": [
 *          "directory"
 *        ],
 *        "caja.desktop": [
 *          "directory"
 *        ]
 *      }
 *    }
 *
 *
 * @param1: targetFile
 *    string, a file name, should be eihter 'defaults.list' or 'mimeinfo.cache'
 *
 * @param2: callabck
 *    Callback would return err if err occurs;otherwise return null.
 *
 **/
function buildAppMethodInfo(targetFile) {
  var _list = ['/usr/share/applications/' + targetFile,
    '/usr/local/share/applications/' + targetFile
  ];
  return promised.read_file(_list[0])
    .then(function(file_content_) {
      return doBuildAppMethodInfo(targetFile, file_content_);
    }, function(err) {
      return promised.read_file(_list[1])
        .then(function(file_content_) {
          return doBuildAppMethodInfo(targetFile, file_content_);
        })
    });
}

function doBuildAppMethodInfo(target_file_, file_content_) {
  return Q.fcall(function() {
      return deParseListFile(file_content_);
    })
    .then(function(resolve_content_) {
      var _out_path = pathModule.join(REAL_APP_DIR, target_file_);
      var _str_content = JSON.stringify(resolve_content_, null, 4);
      return promised.write_file(_out_path, _str_content)
    })
}

/** 
 * @Method: findAllDesktopFiles
 *    To find all .desktop files from system. It would echo $XDG_DATA_DIRS
 *    to get all related dirs first, then sreach in those dirs.
 *
 * @param: callback
 *    @result
 *    object, an array of all desktop file's full path
 *
 *    example:
 *        [
 *         "/usr/share/xfce4/helpers/urxvt.desktop",
 *         "/usr/share/xfce4/helpers/lynx.desktop",
 *         "/usr/share/xfce4/helpers/rodent.desktop",
 *         "/usr/share/xfce4/helpers/icecat.desktop",
 *         "/usr/share/xfce4/helpers/pcmanfm.desktop",
 *         "/usr/share/xfce4/helpers/mozilla-browser.desktop"
 *        ]
 *
 **/
function findAllDesktopFiles() {
  var _filelist = [];
  var _reg_desktop = /\.desktop$/;
  var _path_local_share = '/usr/local/share/applications';
  var _path_share = '/usr/share/applications';
  return nextSearch(_path_local_share)
    .then(function(local_share_list_) {
      _filelist = _filelist.concat(local_share_list_);
      return nextSearch(_path_share)
        .then(function(share_list_) {
          _filelist = _filelist.concat(share_list_);
          return _filelist;
        })
    }, function() {
      return nextSearch(_path_share)
        .then(function(share_list_) {
          _filelist = _filelist.concat(share_list_);
          return _filelist;
        });
    })


  function nextSearch(_path) {
    return promised.read_dir(_path)
      .then(function(file_list_) {
        return resolveDesktopFile(_path, file_list_);
      });
  }

  function resolveDesktopFile(pre_dir_, file_list_) {
    var _result = [];
    for (var i = 0, l = file_list_.length; i < l; i++) {
      if (_reg_desktop.test(file_list_[i])) {
        _result.push(pathModule.join(pre_dir_, file_list_[i]));
      }
    }
    return _result;
  }
}
exports.findAllDesktopFiles = findAllDesktopFiles;

function buildLocalDesktopFile() {
  return findAllDesktopFiles()
    .then(function(file_list_) {
      for (var i = 0, l = file_list_.length; i < l; i++) {
        var _filenanme = pathModule.basename(file_list_[i]);
        var _new_path = pathModule.join(REAL_APP_DIR, _filenanme);
        fs_extra.copySync(file_list_[i], _new_path);
      }
    })
}

/** 
 * @Method: writeDesktopFile
 *    modify a desktop file
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                read error   : "writeDesktopFile : desktop file NOT FOUND!"
 *                write error  : "writeDesktopFile : write desktop file error!"
 *                parse error  : "writeDesktopFile : parse desktop file error!"
 *                parse error  : "writeDesktopFile : deparse desktop file error!"
 *                input  error : "writeDesktopFile : entry content empty!"
 *
 *    @param2: result
 *        string, retrieve 'success' when success
 *
 * @param2: sFileName
 *    string, a file name
 *    exmple: var sFileName = 'cinnamon';
 *
 * @param3: oEntries
 *    object, this object indludes those entries that you want
 *            to change in this desktop file.
 *
 *    example:
 *    var oEntries = {
 *      "[Desktop Entry]": {
 *        "Name": "Videos",
 *        "Name[zh_CN]": "test",
 *        "Comment": "test",
 *        "Comment[zh_CN]": "test",
 *        "Keywords": "test",
 *        "Exec": "test",
 *        "Icon": "test",
 *        "Terminal": "false",
 *        "Type": "test",
 *        "Categories": "test",
 *      },
 *      "[Desktop Action Play]": {
 *        "Name": "test/test",
 *        "Exec": "test --play-pause",
 *        "OnlyShowIn": "test;"
 *      },
 *      "[Desktop Action Next]": {
 *        "Name": "test",
 *        "Exec": "test --next",
 *        "OnlyShowIn": "Unity;"
 *      }
 *    }
 *
 **/
function writeDesktopFile(sFileName, oEntries) {
  var _file_path = pathModule.join(REAL_DIR, 'applications', sFileName);

  function modifyContent(attr) {
    for (var entry in oEntries) {
      if (oEntries[entry]) {
        for (var element in oEntries[entry]) {
          attr[entry][element] = oEntries[entry][element];
        }
      } else {
        var _err = new Error("writeDesktopFile : entry content empty!");
        throw _err;
      }
    }
    return attr;
  }

  return findDesktopFile(sFileName)
    .then(function(file_content_) {
      return parseDesktopFile(file_content_);
    })
    .then(function(resolved_content_) {
      return modifyContent(resolved_content_);
    })
    .then(function(modified_content_) {
      return deParseDesktopFile(modified_content_);
    })
    .then(function(modified_file_content_) {
      return promised.write_file(_file_path, modified_file_content_);
    });
}

/** 
 *
 * @Method: getAllDesktopFile
 *    get all .desktop files in local
 *
 * @param: callback
 *    @result
 *    object, an array of all desktop file's name
 *
 *    example:
 *        [
 *         "urxvt.desktop",
 *         "lynx.desktop",
 *         "rodent.desktop",
 *         "icecat.desktop",
 *         "pcmanfm.desktop",
 *         "mozilla-browser.desktop",
 *        ]
 *
 **/
function getAllDesktopFile() {
  var sTarget = pathModule.join(RESOURCEPATH, "desktop", "data", "applications");

  function getInode(file_name_) {
    var _file_path = pathModule.join(sTarget, file_name_);
    return promised.stat(_file_path)
      .then(function(inode_) {
        return [file_name_, inode_.ino];
      });
  }

  function resolveInodeList(file_list_) {
    var _inode_list = {};
    for (var i = 0, l = file_list_.length; i < l; i++) {
      _inode_list[file_list_[i][0]] = file_list_[i][1];
    }
    return _inode_list;
  }

  return promised.read_dir(sTarget)
    .then(function(name_list_) {
      return Q.all(name_list_.map(getInode));
    })
    .then(function(result_) {
      return resolveInodeList(result_);
    });
}
exports.getAllDesktopFile = getAllDesktopFile;



/** 
 * @Method: readDesktopConfig
 *    To read desktop config file. Including .conf, .desktop, .list and . cache
 *
 * @param1: sFileName
 *    string, a short name as 'cinnamon.desktop', the postfix is required.
 *
 * @param2: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error info.
 *
 *    @param2: result,
 *        object, result in json, more detail example in specifc function commn-
 *                ent.
 *
 **/
function readDesktopConfig(sFileName) {
  var postfix = pathModule.extname(sFileName);
  var _options = {
    ".conf": readConf,
    ".desktop": readDesktopFile,
    ".list": readAppMethod,
    ".cache": readAppMethod
  };
  return _options[postfix](sFileName);
}
exports.readDesktopConfig = readDesktopConfig;

/** 
 * @Method: writeDesktopConfig
 *    To modify desktop config file. Including .conf, .desktop, .list and . cac-
 *    he
 *
 * @param1: sFileName
 *    string, a short name as 'cinnamon.desktop', the postfix is required.
 *
 * @param2: oContent
 *    object, content to modify, should a object, more detail example in specifc
 *            function commnent.
 *
 * @param3: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain specific error info.
 *
 *    @param2: result,
 *        string, retrieve 'success' when success
 *
 **/
function writeDesktopConfig(sFileName, oContent) {
  var postfix = pathModule.extname(sFileName);
  var _options = {
    ".conf": writeConf,
    ".desktop": writeDesktopFile
  }
  return _options[postfix](sFileName, oContent);
}
exports.writeDesktopConfig = writeDesktopConfig;

/** 
 * @Method: shellExec
 *    execute a shell command
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                exec error   : "shellExec : [specific err info]"
 *
 *    @param2: result,
 *        string, stdout info in string as below
 *                '/usr/share/cinnamon:/usr/share/gnome:/usr/local/share/:/usr/-
 *                -share/:/usr/share/mdm/'
 
 *
 * @param2: command
 *    string, a shell command
 *    exmple: var command = 'echo $XDG_DATA_DIRS'
 *
 *
 **/
function shellExec(callback, command) {
  var systemType = os.type();
  if (systemType === "Linux") {
    exec(command, function(err, stdout, stderr) {
      if (err) {
        console.log(stderr, err);
        var _err = 'shellExec : ' + err;
        callback(_err, null);
      } else {
        console.log("exec: " + command);
        console.log(stdout);
        callback(null, stdout);
      }
    })
  }
}
exports.shellExec = shellExec;

/** 
 * @Method: moveFile
 *    To move a file or dir from oldPath to newPath.
 *    Path is limited under /desktop.
 *    !!!The dir CAN have content and contend would be move to new dir as well.
 *    !!!Notice that if you are moving a dir, the newPath has to be a none exist
 *    !!!new dir, otherwise comes error.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                echo error : 'moveFile : echo $HOME error'
 *                move error : 'moveFile : move error'
 *
 *    @param2: result,
 *        string, retrieve 'success' when success
 *
 * @param2: oldPath
 *    string, a dir under user path
 *    exmple: var oldPath = '/test.txt'
 *    (compare with a full path: '/home/xiquan/.resources/DesktopConf/Theme.conf')
 *
 * @param3: newPath
 *    string, a dir under user path
 *    exmple: var newPath = '/testDir/test.txt'
 *    (compare with a full path: '/home/xiquan/.resources/DesktopConf/BadTheme.conf')
 *
 **/
function moveFile(callback, oldPath, newPath) {
  var oldFullpath = pathModule.join(REAL_DIR, 'desktop', oldPath);
  var newFullpath = pathModule.join(REAL_DIR, 'desktop', newPath);
  fs_extra.move(oldFullpath, newFullpath, function(err) {
    if (err) {
      console.log(err);
      var _err = 'moveFile : move error';
      callback(_err, null);
    } else {
      console.log('move ', oldPath, ' to ', newPath);
      callback(null, 'success');
    }
  })
}
exports.moveFile = moveFile;

/** 
 * @Method: renameDesktopFile
 *    To rename a desktop file
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param1: _err,
 *        string, contain error info as below
 *                write error : 'renameDesktopFile : specific error'
 *
 *    @param2: result,
 *        string, retrieve 'success' when success
 *
 * @param2: oldName
 *    string, file name of specific file you need to rename
 *    exmple: var oldName = 'exampleName.desktop'
 *
 * @param3: newName
 *    string, a new name that you want to set
 *    example: var newName = 'newName'
 *
 **/
function renameDesktopFile(oldName, newName) {
  var sFilename = oldName + '.desktop';
  var oEntries = {
    '[Desktop Entry]': {
      'Name': newName,
      'Name[zh_CN]': newName
    }
  }
  return writeDesktopFile(sFilename, oEntries);
}
exports.renameDesktopFile = renameDesktopFile;


function openDataByRawPath(callback, filePath) {
  var sCommand = 'xdg-open ' + filePath;
  exec(sCommand, function(err, stdout, stderr) {
    if (err) {
      console.log(err, stdout, stderr);
      return callback(err);
    }
    callback('success')
  })
}
exports.openDataByRawPath = openDataByRawPath;


/** 
 * @Method: linkAppToDesktop
 *    Make a soft link from a desktop file to /desktop or /dock
 *
 * @param2: sApp
 *    string, file name of specific file you need to rename
 *    exmple: var oldName = 'exampleName.desktop'
 *
 * @param3: sType
 *    string, only 2 choices: 'desktop', 'dock'
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain error info as below
 *                write error : 'renameDesktopFile : specific error'
 *
 *    @param: result,
 *        string, retrieve success when success.
 *
 **/
function linkAppToDesktop(sApp, sType) {
  if (sType !== 'desktop' && sType !== 'dock') {
    var _err = "Error: bad dir type!";
    throw new Error(_err);
  }
  var sSrc = pathModule.join(REAL_APP_DIR, sApp);
  var sDes = pathModule.join(REAL_DIR, sType, sApp);
  return promised.symlink(sSrc, sDes);
}
exports.linkAppToDesktop = linkAppToDesktop;

/** 
 * @Method: unlinkApp
 *    Unlink from a desktop file to /desktop or /dock
 *
 * @param2: sDir
 *    string, a link short path as /desktop/test.desktop.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain error info as below
 *                write error : 'renameDesktopFile : specific error'
 *
 *    @param: result,
 *        string, retrieve success when success.
 *
 **/
function unlinkApp(sDir) {
  var sTarget = pathModule.join(REAL_DIR, sDir);
  return promised.unlink(sTarget);
}
exports.unlinkApp = unlinkApp;

/** 
 * @Method: moveToDesktop
 *    To drag a file from any where to desktop.
 *
 * @param2: sFilePath
 *    string, a target file path, should be a full path.
 *            example: '/home/xiquan/somedir/somefile.txt'.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        array, the file info of target after load into local db.
 *        example:
 *        var fileInfo = [sFilePath, stats.ino];
 *
 **/
function moveToDesktopSingle(sFilePath) {
  var reg_isLocal = /\/[a-z]+\/[a-z]+\/\.custard\/\/resource\/[a-z]+\/data\//gi;
  if (reg_isLocal.test(sFilePath)) {
    console.log("exist in database");
    return setDesktopTag(sFilePath);
  }
  return promised.open(config.TYPECONFPATH, 'r')
    .then(function(fd_) {
      return promised.close(fd_)
    }, function() {
      return typeHandle.initTypeDef()
    })
    .then(function() {
      return commonHandle.createData([sFilePath])
    })
    .then(function() {
      return setDesktopTag(sFilePath);
    })
    .then(function(option_) {
      return commonHandle.getItemByProperty(option_)
        .then(function(info_) {
          return promised.stat(info_[0].path)
            .then(function(stat_) {
              return [info_[0].path, stat_.ino];
            })
        })
    });
}
exports.moveToDesktopSingle = moveToDesktopSingle;


function setDesktopTag(filepath) {
  var _full_name = pathModule.basename(filepath);
  if (_full_name.lastIndexOf('.') !== -1) {
    var _name = _full_name.substring(0, _full_name.lastIndexOf('.'))
  } else {
    var _name = _full_name;
  }
  var _option = {
    _type: "base",
    _property: "filename",
    _value: _name
  }
  return tagsHandle.setTagByProperty([DESKTAG], _option)
    .then(function() {
      return _option;
    })
}

/*TODO: sqlite bug, not complete*/
/** 
 * @Method: moveToDesktop
 *    To drag multiple files from any where to desktop.
 *
 * @param2: oFilePath
 *    string, array of file path, should be a full path.
 *            example: ['/home/xiquan/somedir/somefile.txt'].
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        string, the path of target after load into local db.
 *
 **/
function moveToDesktop(oFilePath, callback) {
  /*TODO:rewrite*/
}
exports.moveToDesktop = moveToDesktop;


/** 
 * @Method: removeFileFromDB
 *   To remove a file from desktop. This action will remove this file from data
 *   frame also.
 *
 * @param2: sFilePath
 *    string, file path, should be a full path in local.
 *            example: '/home/xiquan/.resource/document/data/somefile.txt'.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        string, retrieve 'success' when success.
 *
 **/
function removeFileFromDB(sFilePath) {
  var _full_name = pathModule.basename(sFilePath);
  var _name = _full_name.substring(0, _full_name.lastIndexOf('.'));
  var _option = {
    _type: "base",
    _property: "filename",
    _value: _name
  }
  return commonHandle.removeItemByProperty(_option);
}
exports.removeFileFromDB = removeFileFromDB;

/** 
 * @Method: removeFileFromDesk
 *   To remove a file from desktop. This action will only remove this file from
 *   desktop.
 *
 * @param2: sFilePath
 *    string, file path, should be a full path in local.
 *            example: '/home/xiquan/.resource/document/data/somefile.txt'.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        string, retrieve 'success' when success.
 *
 **/
function removeFileFromDesk(sFilePath) {
  var _option = {
    _type: "base",
    _property: "path",
    _value: sFilePath
  }
  return tagsHandle.rmTagsByProperty(['$desktop$'], _option);

}
exports.removeFileFromDesk = removeFileFromDesk;


/** 
 * @Method: getFilesFromDesk
 *   To get all files on desktop.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        object, array of file info,
 *                as [{filePath: '/home/xiquan/a.txt',
 *                     inode:    '1902384109',
 *                     tags:     '$desktop$aa$bb$'
 *                   }]
 *
 **/
function getFilesFromDesk() {
  function resolveIno(info) {
    return promised.stat(info.path)
      .then(function(stat_) {
        return [info.path, stat_.ino];
      })
  }
  return tagsHandle.getFilesByTags([DESKTAG])
    .then(function(result) {
      var _combination = [];
      for (var i = 0, l = result.length; i < l; i++) {
        _combination.push(resolveIno(result[i]));
      }
      return Q.all(_combination);
    })
}
exports.getFilesFromDesk = getFilesFromDesk;

/** 
 * @Method: getAllVideo
 *   To get all vidoe files.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        object, array of file info, as [filePath,inode]
 *
 **/
function getAllVideo(callback) {
  return commonHandle.getAllDataByCate("video")
    .then(getInode);
}
exports.getAllVideo = getAllVideo;

/** 
 * @Method: getAllMusic
 *   To get all music files.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        object, of all music file info as{inode:oFileInfo}.
 *                more detail in document.
 **/
function getAllMusic() {
  return commonHandle.getAllDataByCate("music")
    .then(getInode);
}
exports.getAllMusic = getAllMusic;

function getInode(file_list) {
  var _result = {};

  function resolveInode(file_info) {
    return promised.stat(file_info.path)
      .then(function(stat_) {
        _result[stat_.ino] = file_info;
      })
  }
  return Q.all(file_list.map(resolveInode))
    .then(function() {
      return _result;
    });
}

/*TODO: To be continue...*/
/** 
 * @Method: getIconPath
 *   To get icon path.
 *
 * @param1: iconName_
 *    string, a short icon path.
 *
 * @param2: size_
 *    num, size of icon
 *
 * @param3: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        object, array of icon path.
 *
 **/
function getIconPath(iconName_, size_, callback) {
  //get theme config file
  //get the name of current icon-theme
  //1. search $HOME/.icons/icon-theme_name/subdir(get from index.theme)
  //2. if not found, search $XDG_DATA_DIRS/icons/icon-theme_name
  //   /subdir(get from index.theme)
  //3. if not found, search /usr/share/pixmaps/subdir(get from index.theme)
  //4. if not found, change name to current theme's parents' recursively 
  //   and repeat from step 1 to 4
  //5. if not found, return default icon file path(hicolor)
  //
  if (typeof callback !== "function")
    throw "Bad type of callback!!";

  function readConfCb(err, result) {
    if (err) {
      console.log(err);
      return callback(err, null);
    }
    var iconTheme = result['icontheme']['name'];

    getIconPathWithTheme(iconName_, size_, iconTheme, function(err_, iconPath_) {
      if (err_) {
        getIconPathWithTheme(iconName_, size_, "hicolor", function(err_, iconPath_) {
          if (err_) {
            exec('locate ' + iconName_ + ' | grep -E \"\.(png|svg)$\"', function(err, stdout, stderr) {
              if (err || stdout == '') return callback('Not found');
              return callback(null, stdout.replace(/\n$/, '').split('\n').reverse());
            });
          } else {
            callback(null, iconPath_);
          }
        });
      } else {
        callback(null, iconPath_);
      }
    });
  }
  readConf_node(readConfCb, 'Theme.conf');
}
exports.getIconPath = getIconPath;

function getIconPathWithTheme(iconName_, size_, themeName_, callback) {
  if (typeof callback != 'function')
    throw 'Bad type of function';
  var HOME_DIR_ICON = pathModule.join(utils.getHomeDir(), "/.local/share/icons/");
  var XDG_DATA_DIRS = utils.getXdgDataDirs();
  var _iconSearchPath = [];
  _iconSearchPath.push(HOME_DIR_ICON);
  for (var i = 0; i < XDG_DATA_DIRS.length; i++) {
    var item = pathModule.join(XDG_DATA_DIRS[i], "/icons/");
    _iconSearchPath.push(item);
  }
  _iconSearchPath.push("/usr/share/pixmaps")

  var findIcon = function(index_) {
    if (index_ == _iconSearchPath.length) {
      return callback('Not found');
    }
    var _path = _iconSearchPath[index_];
    if (index_ < _iconSearchPath.length - 1) _path += themeName_;
    fs.exists(_path, function(exists_) {
      if (exists_) {
        var tmp = 'find ' + _path + ' -regextype \"posix-egrep\" -regex \".*' + ((index_ < _iconSearchPath.length - 1) ? size_ : '') + '.*/(.*/)*' + iconName_ + '\.(svg|png)$\"';
        exec(tmp, function(err, stdout, stderr) {
          if (err) {
            console.log(err, stdout, stderr);
            return;
          }
          if (stdout == '') {
            fs.readFile(_path + '/index.theme', 'utf-8', function(err, data) {
              var _parents = [];
              if (err) {
                //console.log(err);
              } else {
                var lines = data.split('\n');
                for (var i = 0; i < lines.length; ++i) {
                  if (lines[i].substr(0, 7) == "Inherits") {
                    attr = lines[i].split('=');
                    _parents = attr[1].split(',');
                  }
                }
              }
              //recursive try to find from parents
              var findFromParent = function(index__) {
                if (index__ == _parents.length) return;
                getIconPathWithTheme(iconName_, size_, _parents[index__], function(err_, iconPath_) {
                  if (err_) {
                    findFromParent(index__ + 1);
                  } else {
                    callback(null, iconPath_);
                  }
                });
              };
              findFromParent(0);
              //if not fonud
              findIcon(index_ + 1);
            });
          } else {
            callback(null, stdout.split('\n'));
          }
        });
      } else {
        findIcon(index_ + 1);
      }
    });
  };
  findIcon(0);
}

/** 
 * @Method: createFile
 *   To create a txt file on desktop.
 *
 * @param1: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        object, file info of the new file, as [filePath, stats.ino].
 *
 **/
function createFile(sContent) {
  var date = new Date();
  var filename = 'newFile_' + date.toLocaleString().replace(' ', '_') + '.txt';
  var desPath = '/tmp/' + filename;
  return promised.write_file(desPath, sContent)
    .then(function() {
      return commonHandle.createData([desPath]);
    })
    .then(function() {
      return promised.remove(desPath);
    });
}
exports.createFile = createFile;


/** 
 * @Method: rename
 *   To rename a file on desktop. Front end needs to control that the postfix c-
 *   not be change.
 *
 * @param1: oldName
 *    @string, origin name of the file, as 'good_file.txt'
 *
 * @param2: newName
 *    @string, new name of the file, as 'bad_file.txt'
 *
 * @param3: callback
 *    @result, (_err,result)
 *
 *    @param: _err,
 *        string, contain specific error info.
 *
 *    @param: result,
 *        string, would return 'EXIST' when new file name exists in db; otherwi-
 *                se, return 'success'.
 *
 **/
function rename(oldName, newName) {
  if (newName === oldName) {
    return callback(null, 'success');
  }
  var _pos_old = oldName.lastIndexOf('.');
  var _pos_new = newName.lastIndexOf('.');
  var _basename_old = _pos_old ? oldName.substr(0, _pos_old) : oldName;
  var _basename_new = _pos_new ? newName.substr(0, _pos_new) : newName;
  var _option = {
      _type: "base",
      _property: "filename",
      _value:_basename_old
    }
    /*TODO:need check exist name in database*/
  return commonHandle.getItemByProperty(_option)
    .then(function(file_info_) {
      return commonHandle.renameDataByUri(file_info_[0].URI, _basename_new);
    })
}
exports.rename = rename;