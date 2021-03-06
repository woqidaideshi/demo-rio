var net = require('net');
var path = require('path');
var fs = require('fs');
var hashtable = require('hashtable');
var crypto = require('crypto');
var NodeRsa = require('node-rsa');
var rsaKey = require('./rsaKey');
var account = require('./pubkeyServer.js');
var config = require('../config.js');
var HOME_DIR ="/home";
var CURUSER = process.env['USER'];
var USERCONFIGPATH = config.USERCONFIGPATH;
var uniqueID = require(config.USERCONFIGPATH + '/uniqueID.js')

var LOCALACCOUNT = uniqueID.Account;
var LOCALACCOUNTKEY = uniqueID.AccountKey;
var LOCALUUID = uniqueID.uniqueID;

var LOCALPRIKEY = '/key/rio_rsa';
var KEYSERVERPUB = '/key/serverKey.pem';
var LOCALPUBKEY = '/key/rio_rsa.pem';//use in imchat
var PUB_KEY = "/key/rio_rsa.pub";//use in msgTransfer

/*
 * @method MD5
 *  计算某个字符串的MD5值
 * @param str
 *  待计算的字符串
 * @param encoding
 *  编码方式，默认为hex，该参数可省略
 * @return md5
 *  返回md5校验值
 */
function MD5(str, encoding) {
  return crypto.createHash('md5').update(str).digest(encoding || 'hex');
}

/*
* @method initIMServer
* @param Port
* 消息服务器指定要绑定的端口
*  初始化本地消息接收Server，该Server负责所有的通信接收，存储，回复ACK等操作
* @param ReceivedMsgCallback
*   当成功接收到客户端发来的消息时，调用该回调函数
*    @msg
*     string 回调函数参数，表示成功接收到的消息
* @return null
*  没有返回值
*/
function initIMServer(port,ReceivedMsgCallback) {
  /*
    we should load the keyPair first, in order to encrypt messages with RSA
    */
  var keyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
  var pubKey = keyPair.getPublicPEM().toString('utf8');

  var server = net.createServer(function(c) {
    console.log('Remote ' + c.remoteAddress + ' : ' + c.remotePort + ' connected!');
    var remoteAD = c.remoteAddress;
    var remotePT = c.remotePort;

    c.on('data', function(msgStri) {
      console.log('data from :' + remoteAD + ': ' + remotePT + ' ' + msgStri);
      /*
        keyPair to be intergrated by Account Server
        keyPair should be loaded by local account
        */
      var msgStr = JSON.parse(msgStri);
      if (msgStr[0].type == 'SenderChangePubkey') {
        var badkey = JSON.parse(msgStr[0].content);
        console.log("pubkey :" + badkey["uuid"] + " in " + badkey["from"] + " incorrect");
        var localkeyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
        requestPubKey(badkey["uuid"], badkey["from"], localkeyPair, function() {});
        return;
      };
      try {
        var decrypteds = keyPair.decrypt(msgStr[0].content.toString('utf-8'), 'utf8');
        console.log('decrypteds：' + decrypteds);
        var msgObj = JSON.parse(decrypteds);
        console.log(msgObj);
        console.log('MSG type:' + msgObj.type);
      } catch (err) {
        console.log(err);
        console.log("sender pubkey error, change pubkey and try again");
        var badpubkey = encapsuMSG('', 'SenderChangePubkey', LOCALACCOUNT, LOCALUUID, '','');
        c.write(badpubkey);
        return;
      }
      switch (msgStr[0].type) {
        case 'SentEnFirst':
          {
            var CalBakMsg = {};
            CalBakMsg['MsgObj'] = msgObj;
            CalBakMsg['IP'] = remoteAD; 
            setTimeout(ReceivedMsgCallback(msgObj.type,CalBakMsg), 0);
            //console.log("pubkey is "+pubKey);
            isExist(msgObj.uuid, function() {
              var tmpkey = rsaKey.loadServerKey(USERCONFIGPATH + '/key/users/' + msgObj.uuid + '.pem');
              var tp = encapsuMSG(MD5(msgObj.message), "Reply", LOCALACCOUNT, LOCALUUID, msgObj.from,msgObj.type,'');
              var tmpsmsg = encryptSentMSG(tp, tmpkey)
              c.write(tmpsmsg);
            }, function() {
              requestPubKey(msgObj.uuid, msgObj.from, keyPair, function() {
                var tmpkey = rsaKey.loadServerKey(USERCONFIGPATH + '/key/users/' + msgObj.uuid + '.pem');
                var tp = encapsuMSG(MD5(msgObj.message), "Reply", LOCALACCOUNT, LOCALUUID, msgObj.from,msgObj.type,'');
                var tmpsmsg = encryptSentMSG(tp, tmpkey)
                c.write(tmpsmsg);
              });
            });
          }
          break;
        case 'Reply':
          {
            //console.log("=========================================");
            //sender received message, sesson end
          }
          break;
        default:
          {
            console.log("this is in default switch on data");
          }
      }
    });

    c.on('close', function() {
      console.log('Remote ' + remoteAD + ' : ' + remotePT + ' disconnected!');
    });


    c.on('error', function() {
      console.log('Unexpected Error!');
    });

  });

  server.on('error', function(err) {
    console.log("Error: " + err.code + " on " + err.syscall);
  });

  server.listen(port, function() {
    console.log('IMServer Binded! ' + port);
  });
}

/*
 * @method sendMSG
 *  根据IP和端口号来发送封装好的数据，若发送成功，则把成功发送的消息存至本地数据库中。若发送失败，则重新发送（循环5次）
 * @param IP
 *  目的方的IP地址
 * @param PORT
 *  接收方帐号
 * @param MSG
 *  用encapsuMSG包装过的待发送消息
 * @param PORT
 *  消息接收方的通信端口
 *@param KEYPAIR
 *发送方的pubkey生成的keypair
 *@param SentCallBack
 *发送方发送数据成功后的callback函数
 *     @msg
 *     string 回调函数参数，表示发送成功的消息
 * @return null
 *  没有返回值
 */
function sendIMMsg(IP, PORT, SENDMSG, KEYPAIR, SentCallBack) {
  var count = 0;
  var id = 0;
  var tmpenmsg = encryptSentMSG(SENDMSG, KEYPAIR);
  var MSG = JSON.parse(SENDMSG);
  var dec = MSG[0].content;
  var pat = JSON.parse(dec);

  if (!net.isIP(IP)) {
    console.log('Input IP Format Error!');
    return;
  };
  var client = new net.Socket();
  client.setTimeout(6000, function() {
    console.log("connect time out");
    client.end();
  });

  function innerrply() {
    id = setInterval(function(C, tmpenmsg) {
      var innermsg = encryptSentMSG(SENDMSG, KEYPAIR);
      if (count < 5) {
        console.log("this is in resent " + innermsg);
        client.write(innermsg);
        count++;
      } else {
        clearInterval(id);
        console.log("Send message error: no reply ");
      };

    }, 1000, client, MSG);
  }
  switch (MSG[0].type) {
    case 'SentEnFirst':
      {
        console.log("sending message ::: " + tmpenmsg);
        client.connect(PORT, IP, function() {
          client.write(tmpenmsg, function() {});
        });
      }
      break;
    default:
      {
        client.connect(PORT, IP, function() {
          client.write(tmpenmsg, function() {});
        });
      }
  }

  client.on('connect', innerrply);

  client.on('data', function(REPLY) {
    console.log("remote data arrived! " + client.remoteAddress + " : " + client.remotePort);
    var RPLY = JSON.parse(REPLY);
    switch (RPLY[0].type) {
      case 'Reply':
        {
          var keyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
          try {
            var decrply = keyPair.decrypt(RPLY[0].content.toString('utf-8'), 'utf8');
          } catch (err) {
            console.log(err);
            console.log("Destination system got the wrong PubKey, notify him to change ...");
            var badpubkey = encapsuMSG('', 'SenderChangePubkey', LOCALACCOUNT, LOCALUUID, '','');
            client.write(badpubkey);
            clearInterval(id);
            client.end();
            return;
          }
          console.log("decry message:" + decrply);
          var msg = JSON.parse(decrply);
          switch (msg.type) {
            case 'Reply':
              {
                if (msg.message == MD5(pat.message)) {
                  var msgtp = pat;
                  console.log('msg rply received: ' + msg.message);
                  //  dboper.dbsentInsert(msgtp.from, msgtp.to, msgtp.message, msgtp.type, msgtp.time, function() {
                  // console.log("sent message insert into db success!");        });
                  setTimeout(SentCallBack(msgtp.message), 0);
                  clearInterval(id);
                  client.end();
                };
              }
              break;
          }
        }
        break;
      case 'SenderChangePubkey':
        {
          var badkey = JSON.parse(RPLY[0].content);
          console.log("pubkey :" + badkey["uuid"] + " in " + badkey["from"] + " incorrect");
          var localkeyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
          requestPubKey(badkey["uuid"], badkey["from"], localkeyPair, function() {});
          clearInterval(id);
          client.end();
        }
        break;
    }


  });

  client.on('error', function(err) {
    console.log("Error: " + err.code + " on " + err.syscall + " !  IP : " + IP);
    clearInterval(id);
    client.end();
  });
}

/*
 * @method sendMSGbyAccount
 *  根据账户来发送消息，该函数从对应表中获取某一帐号所对应的所有IP地址集合，然后遍历该集合，把消息推送到该帐号的所有IP地址
 * @param TABLE
 *  用来存储ACCOUNT和IP对应关系的对应表，若对应表为空，说明该机器不在局域网内，将该消息推送到服务器端
 * @param ACCOUNT
 *  接收方帐号
 * @param MSG
 *  待发送消息
 * @param PORT
 *  消息接收方的通信端口
 * @return null
 *  没有返回值
 */
function sendMSGbyAccount(TABLE, ACCOUNT, MSG, PORT) {
  var ipset = TABLE.get(ACCOUNT);

  if (typeof ipset == "undefined") {
    console.log("destination account not in local lan!");
    /*
        here are some server msg send functions!
        */
  };

  var localkeyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
  /*
    MSG already be capsuled by encapsuMSG function
    */
  for (var i = 0; i < ipset.length; i++) {
    console.log("sending " + ipset[i].UID + " in account " + ACCOUNT);
    existsPubkeyPem(ipset[i], ACCOUNT, MSG, PORT, localkeyPair, function(msg) {
      console.log("msg sent successful:::" + msg);
    });
  };

  console.log("send " + ipset.length + " IPs in " + ACCOUNT);
}

function sendMSGbyUID(IPSET, ACCOUNT, MSG, PORT, TOAPP,SENTCALLBACK) {
  if (typeof IPSET.UID == "undefined") {
    console.log("receiver uuid null");
  };
  var localkeyPair = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY);
  existsPubkeyPem(IPSET, ACCOUNT, MSG, PORT, localkeyPair, TOAPP,SENTCALLBACK);
}

function existsPubkeyPem(IPSET, ACCOUNT, MSG, PORT, LOCALPAIR, TOAPP,SENTCALLBACK) {
  function insendfunc() {
    var tmppubkey = rsaKey.loadServerKey(USERCONFIGPATH + '/key/users/' + IPSET.UID + '.pem');
    var tmpmsg = encapsuMSG(MSG, "SentEnFirst", LOCALACCOUNT, LOCALUUID, ACCOUNT,TOAPP);
 //   console.log(tmpmsg);
    sendIMMsg(IPSET.IP, PORT, tmpmsg, tmppubkey, SENTCALLBACK);
  }
  function rqstpubkey() {
    console.log("nonexist");
    requestPubKey(IPSET.UID, ACCOUNT, LOCALPAIR, insendfunc);
  }
  isExist(IPSET.UID, insendfunc, rqstpubkey);
}

function isExist(UUID, existfunc, noexistfunc) {
  fs.exists(USERCONFIGPATH + '/key/users/' + UUID + '.pem', function(exists) {
    //console.log(USERCONFIGPATH+'/key/users/' + UUID + '.pem');
    if (exists) {
      existfunc();
    } else {
      noexistfunc();
    };
  });
}

/*
 * @method requestPubKey
 *  去公钥服务器上获取指定的公钥
 * @param UUID
 *  待获取的pubkey所属机器的UUID编号
 * @param ACCOUNT
 *  待获取的pubkey所属UUID所属的帐号名称
 * @param LOCALPAIR
 *  本地KeyPair对
 * @param INSENTFUNC
 *  获取的pubkey成功保存到本地后的回调函数
 * @return null
 */
function requestPubKey(UUID, ACCOUNT, LOCALPAIR, INSENTFUNC) {
  console.log("Pubkey of device: " + UUID + " in " + ACCOUNT + " doesn't exist , request from server!");
  var serverKeyPair = rsaKey.loadServerKey(USERCONFIGPATH + KEYSERVERPUB);
  var tmppubkey = rsaKey.initSelfRSAKeys(USERCONFIGPATH + LOCALPRIKEY).getPublicPEM().toString('utf8');
  account.getPubKeysByName(LOCALACCOUNT, LOCALUUID, ACCOUNT, LOCALPAIR, serverKeyPair, function(msg) {
    console.log(JSON.stringify(msg.data.detail));
    msg.data.detail.forEach(function(row) {
      if (row.UUID == UUID) {
        savePubkey(USERCONFIGPATH + '/key/users/' + row.UUID + '.pem', row.pubKey, INSENTFUNC);
      };
    });
  });
}

function savePubkey(SAVEPATH, PUBKEY, CALLBACK) {
  fs.exists(SAVEPATH, function(exists) {
    if (exists) {
      fs.unlinkSync(SAVEPATH);
      console.log("Wrong pubkey " + SAVEPATH + " deleted!")
      fs.appendFile(SAVEPATH, PUBKEY, 'utf8', function(err) {
        if (err) {
          console.log("savepubKey Error: " + err);
        } else {
          console.log("savepubKey successful");
          CALLBACK();
        }
      });
    } else {
      fs.appendFile(SAVEPATH, PUBKEY, 'utf8', function(err) {
        if (err) {
          console.log("savepubKey Error: " + err);
        } else {
          console.log("savepubKey successful");
          CALLBACK();
        }
      });
    }
  })
}

/*
 * @method encapsuMSG
 *  将待发送的消息封装成JSON格式，并将JSON数据序列化
 * @param MSG
 *  消息内容，如可以是聊天内容，上下线通知等
 * @param TYPE
 *  消息类型，可以是Chat，Reply等
 * @param FROM
 *  消息的发送方标识，可以是Account帐号
 * @param FROMUUID
 *  消息的发送方的UUID
 * @param TO
 *  消息的接收方标识，可以是Account帐号
 * @return rply
 *  封装好，并且已经序列化的消息字符串
 */
function encapsuMSG(MSG, TYPE, FROM, FROMUUID, TO,TOAPP) {
  var MESSAGE = [];
  var tmp = {};
  var restmp = {};
  var now = new Date();
  restmp['type'] = TYPE;
  restmp['content'] = '';

  switch (TYPE) {
    case 'Chat':
      {
        tmp["from"] = FROM;
        tmp["uuid"] = FROMUUID;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp['type'] = TOAPP;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    case 'Reply':
      {
        tmp["from"] = FROM;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp["type"] = TYPE;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    case 'RegetPubkey':
      {
        //sender got wrong pubkey, notify sender to update pubkey.
      }
      break;
    case 'SentEnFirst':
      {
        tmp["from"] = FROM;
        tmp["uuid"] = FROMUUID;
        tmp["to"] = TO;
        tmp["message"] = MSG;
        tmp['type'] = TOAPP;
        tmp['time'] = now.getTime();
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    case 'SenderChangePubkey':
      {
        tmp["from"] = FROM;
        tmp["uuid"] = FROMUUID;
        var content = JSON.stringify(tmp);
        restmp['content'] = content;
      }
      break;
    default:
      {
        console.log("encapsuMSG : Please take a proper Type.");
      }
  }

  MESSAGE.push(restmp);
  var send = JSON.stringify(MESSAGE);
  return send;
}

function encryptSentMSG(SENTMSG, pubkeyPair) {
  var msg = JSON.parse(SENTMSG);
  var dec = msg[0].content;
  var encon = pubkeyPair.encrypt(dec, 'base64');
  msg[0].content = encon;
  var sent = JSON.stringify(msg);
  return sent;
}

exports.initIMServer = initIMServer;
exports.sendIMMsg = sendIMMsg;
exports.encapsuMSG = encapsuMSG;
exports.sendMSGbyAccount = sendMSGbyAccount;
exports.encryptSentMSG = encryptSentMSG;
exports.sendMSGbyUID = sendMSGbyUID;
