/**
 * Cobox v1.0.0
 *
 * License: http://opensource.org/licenses/MIT
 * Copyright 2015 Garwi
 *
 */

(function(window, $){
    "use strict";

    var W = $(window), B, A, album;

    var CoboxOptions = (function(){
        function CoboxOptions(){
            this.outerBorder = 8;    //图片边框宽度 *2
            this.minLeft     = 10;   //距离左边或者右边的最小距离 *2
            this.minTop      = 60;   //距离上边的最小距离 *2
            this.fadeSpeed   = 300;  //图片渐变显示的速度
            this.speed       = 400;  //图片宽高伸缩的速度
            this.nextClick   = true; //上下张图片切换
            this.textShow    = true; //title 文字显示

            this.tpl = {
                main: '<div class="cobox"><div class="cobox-main"><div class="cobox-outer"><div class="cobox-inner"><img class="cobox-image" src /><div class="cobox-loading"></div></div></div></div><div class="cobox-layer"></div></div>',
                nav: '<a href="#" class="cobox-nav cobox-prev"></a><a href="#" class="cobox-nav cobox-next"></a>'
            };
        }

        return CoboxOptions;
    })();

    var Cobox = (function(){
        function Cobox(options){
            this.options = options;
            this.init();
        }

        Cobox.prototype = {
            constructor: Cobox,
            init: function(){
                this.build();
            }, 

            build: function(){
                B = $('body');
                album = [];
                
                //判断链接是否为图片
                function isImage(link){
                    return $.type(link) === "string" && link.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
                }

                //筛选链接为图片的元素
                function imgLinkfilter(obj){
                    var link = obj.map(function(index, element){
                        if (isImage($(element).attr('href'))) {
                            addToAlbum($(element));
                            return element;
                        }
                    });
                    return link;
                }

                //添加图片的链接和标题到 Album 数组
                function addToAlbum($link) {
                    album.push({
                      link: $link.attr('href'),
                      title: $link.attr('data-title') || $link.attr('title')
                    });
                }

                var $imgLink = $('img').parent('a');
                A = imgLinkfilter($imgLink);

                this.start();
            },

            start: function(){
                var self = this;

                A.on('click', function(){
                    var index = A.index(this);
                    B.append(self.options.tpl.main);

                    var M = B.find('.cobox-main'),
                        mainHeight = B.find('.cobox-outer').height();

                    M.css({'top': self.getTop(mainHeight) + 'px'});

                    if(self.options.nextClick){
                        self.nav(index);
                    }

                    self.cancel();
                    self.loadImage(index);
                    return false;
                });
            },

            loadImage: function(index){
                var self          = this,
                    link          = album[index].link,
                    titleText     = album[index].title,
                    albumLength   = album.length,
                    speed         = this.options.speed,
                    windowWidth   = W.width(),
                    windowHeight  = W.height(),
                    prev          = B.find('.cobox-prev'),
                    next          = B.find('.cobox-next'),
                    M             = B.find('.cobox-main'),
                    outer         = B.find('.cobox-outer');

                B.find('.cobox').fadeIn(self.options.fadeSpeed);

                var img = new Image();
                img.onload = function(){
                    if( self.options.textShow && titleText && (B.find('.cobox-title').length === 0)){
                        M.append('<div class="cobox-title">' + titleText + '</div>');
                    }

                    var width        = img.width,
                        height       = img.height,
                        title        = B.find('.cobox-title'),
                        titleHeight  = title.height(),
                        imgWidth     = windowWidth - self.options.outerBorder - self.options.minLeft,
                        imgHeight    = windowHeight - titleHeight - self.options.outerBorder - self.options.minTop;
                    
                    //如果图片宽度大于浏览器可显示的最大宽度，按最大宽度计算图片宽高
                    if( width > imgWidth ){
                        height  = parseInt((imgWidth * (height / width)), 10);
                        width   = imgWidth;
                    }

                    //如果图片高度大于浏览器可显示的最大高度，按最大高度计算图片宽高
                    if( height > imgHeight ){
                        width   = parseInt((imgHeight * (width / height)), 10);
                        height  = imgHeight;
                    }

                    var mainHeight = height + titleHeight + self.options.outerBorder;

                    M.animate({top: self.getTop(mainHeight)}, speed);

                    function showImage(){
                        title.width(width).show();
                        B.find('.cobox-loading').hide();
                        B.find('.cobox-image').attr('src', link);
                        B.find('.cobox-image').fadeIn();
                        B.find('.cobox-nav').show();
                        //如果是载入的图片是第一张，则隐藏 prev 按钮
                        if(index === 0){
                            prev.hide();
                        } else {
                            prev.show();
                        }

                        //如果是载入的图片是最后一张，则隐藏 next 按钮
                        if(index == albumLength-1){
                            next.hide();
                        } else {
                            next.show();
                        }
                    }

                    //如果切换前后两张图片的宽高一样，则直接显示图片，不显示过渡动画
                    if(outer.height() == height && outer.width() == width){
                        showImage();
                    } else {
                        outer.animate(
                            {height: height}, 
                            speed,
                            function(){
                                outer.animate(
                                    {width: width},
                                    speed,
                                    function(){
                                        showImage();
                                    }
                                );
                            }
                        );
                    }

                };
                //先设置 onload ，再设置 src，兼容旧版本IE。
                img.src = link;
            },

            nav: function(index){
                var self = this,
                    outer = B.find('.cobox-outer');

                outer.append(self.options.tpl.nav);

                var nav = B.find('.cobox-nav');
                nav.on('click', function(event){
                    if($(event.target).attr('class') == 'cobox-nav cobox-prev'){
                        index--;
                        self.changeImage(index);
                    } else {
                        index++;
                        self.changeImage(index);
                    }
                });
            },

            changeImage: function(index){
                B.find('.cobox-image').hide();
                B.find('.cobox-nav').hide();
                B.find('.cobox-title').remove();
                B.find('.cobox-loading').show();
                this.loadImage(index);
            },

            cancel: function(){
                var self  = this,
                    M     = B.find('.cobox-main'),
                    layer = B.find('.cobox-layer');

                M.on('click', function(event){
                    if ($(event.target).attr('class') === 'cobox-main') {
                        self.close();
                    }
                    return false;
                });

                layer.on('click', function(event){
                    if ($(event.target).attr('class') === 'cobox-layer') {
                        self.close();
                    }
                    return false;
                });

            },

            close: function(){
                var cobox = B.find('.cobox');
                
                cobox.fadeOut(this.options.fadeSpeed, function(){
                    cobox.remove();
                });
            },

            //通过主内容高度来计算 top 的大小
            getTop: function(mainHeight){
                var top = (W.height() - mainHeight) / 2 + $(document).scrollTop();
                
                if(top > 0){
                    return top;
                } else {
                    return 0;
                }
            }
        };
        return Cobox;
    })();

    $(function() {
        var options = new CoboxOptions();
        var cobox = new Cobox(options);
    });

})(window, jQuery);