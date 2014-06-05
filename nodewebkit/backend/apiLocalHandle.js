//var config = require("./config");
var commonDAO = require("./DAO/CommonDAO");
var server = require("./server");

function loadResourcesFromLocal(loadResourcesCb,path) {
  server.syncDb(loadResourcesCb,path);
}
exports.loadResourcesFromLocal = loadResourcesFromLocal;

function getAllCateFromLocal(getAllCateCb) {
  function getCategoriesCb(data)
  {
    var cates = new Array();
    data.forEach(function (each){
      cates.push({
        id:each.id,
        type:each.type,
        path:each.logoPath
      });
    });
    getAllCateCb(cates);
  }
  commonDAO.getCategories(getCategoriesCb);
}
exports.getAllCateFromLocal = getAllCateFromLocal;

function getAllDataByCateFromLocal(getAllDataByCateCb,cate) {
  function getAllByCaterotyCb(data)
  {
    var cates = new Array();
    data.forEach(function (each){
      cates.push({
        id:each.id,
        filename:each.filename,
        postfix:each.postfix,
        path:each.path
      });
    });
    getAllDataByCateCb(cates);
  }
  commonDAO.getAllByCateroty(cate,getAllByCaterotyCb);
  
}
exports.getAllDataByCateFromLocal = getAllDataByCateFromLocal;

function getAllContactsFromLocal(getAllContactsCb) {
  function getAllByCaterotyCb(data)
  {
    var contacts = new Array();
    data.forEach(function (each){
      contacts.push({
        id:each.id,
        name:each.name,
        photoPath:each.photoPath
      });
    });
    getAllContactsCb(contacts);
  }
  commonDAO.getAllByCateroty('Contacts',getAllByCaterotyCb);
  
}
exports.getAllContactsFromLocal = getAllContactsFromLocal;

function rmDataByIdFromLocal(rmDataByIdCb,id) {
  commonDAO.deleteItemById(id,server.deleteItemCb,rmDataByIdCb);
}
exports.rmDataByIdFromLocal = rmDataByIdFromLocal;
