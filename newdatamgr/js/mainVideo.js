var MainVideoView = Class.extend({
  init:function(){
    this._videoContainer = $('<div>',{
      'id': 'video-container'
    });
    this._videoContent = $('<div>',{
      'class': 'video-content'
    });
    this._banner = $('<div>',{
      'class': 'banner'
    });
    this._ul = $('<ul>',{
    })

    /*this._videoMiddleBtn = $('<a>',{
      'class': 'video-middle-btn',
    });*/

    this._videoLeftBtn= $('<a>',{
      'class': 'video-left-btn',
    });
    this._videoRightBtn = $('<a>',{
      'class': 'video-right-btn',
    });
    this._unslider = undefined;
    this._globalSelf;
    this._videoContainer.append(this._videoContent);
    this._videoContent.append(this._banner);
    this._banner.append(this._ul);
    //this._videoContainer.append(this._videoMiddleBtn);
    this._videoContainer.append(this._videoLeftBtn);
    this._videoContainer.append(this._videoRightBtn);
    var _this = this;
    _this._tags = [];
    DataAPI.getRecentAccessData(function(err_, video_json_){
      if(err_){
        console.log(err_);
        return;
      }
      if(video_json_.length === 0){
        homePage._noneData++;
        if (homePage._noneData === homePage._dataClasses) {
          $('#avatar')[0].click();
        };
      }
      var _count = 0;
      for(var i = 0; i < video_json_.length; i ++){
        if(video_json_[i].hasOwnProperty('filename') && video_json_[i].hasOwnProperty('URI')){
          _this.addVideo(video_json_[i]);
          DataAPI.getTagsByUri(function(err, result_){
            if(err){
              throw err;
            }
            _this._tags.push(result_);
            _count ++;
            if(_count == video_json_.length){
              _this._tagView = TagView.create({
                position: 'listview',
                max: 5,
                category:'video',
                background_color: 'rgb(232,114,114)'
              });
              _this._tagView.setParent(_this._videoContent);
              _this._tagView.addTags(_this._tags[0]);
              _this.addUnslider();
            }
          }, video_json_[i]['URI']);
        }
      }
    }, 'video', 3);   
    //_globalSelf = this ;
  },

  bindEvent:function(){
    var _this = this;
    this._videoLeftBtn.click(function(ev){
      _this._unslider.prev();
    });

    this._videoRightBtn.click(function(ev){
      _this._unslider.next();
    });
  },

  attach:function($parent_){
    $parent_.append(this._videoContainer);
  },
  /**
   * [addVideo add video View]
   * @param {[json]} video_ [{
   *   path: string
   *   imgPath: string
   *   name: string
   *   tags: [string]
   * }]
   */
  addVideo:function(video_){
    var _this = this;
    var _li = $('<li>',{
      'class': 'video-img',
      'text': video_['filename']
    });
    var _img = $('<img>', {
      'id' : video_['URI']+'videoImgmain'
    });
    var _videoMiddleBtn = $('<a>',{
          'class': 'video-middle-btn',
        });
    basic.getVideoPicData(video_,_img.attr('id'));
    _li.append(_img);
    _li.append(_videoMiddleBtn);
    this._ul.append(_li);

    _videoMiddleBtn.click(function(ev){
      console.log("open");
      basic.openFile(video_);
    });
  },

  addUnslider:function(){
    var _this = this;
    if (!this._unslider) {
      this._unslider = Unslider.create(this._banner, {
        speed: 800,               // 轮播动画速度
        delay: 5000,              // 轮播延时
        begin: function(index_) {
          _this._tagView.refresh(function(){
            _this._tagView.addTags(_this._tags[index_]);
          });
        },  // 完成轮播时的响应函数
        keys: true,               // 支持左右按键转换图片
        fluid: false              // 支持响应设计，屏幕变化
      });
    }
    this.bindEvent();
  },
  hide:function(){
    this._videoContainer.hide();
  },
  show:function(){
    this._videoContainer.show();
  }
});
