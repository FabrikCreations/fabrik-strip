/*global imagesLoaded, jQuery */

/******************************************
 * jQuery FabrikStrip
 *
 * A lightweight, easy-to-use jQuery plugin for responsive slide layout.
 *
 * Author          @jenkins118 (https://fabrik.io)
 * Copyright       Copyright (c) 2015 Phil Jenkins.
 * License         MIT
 * Version         0.0.0.1
 *
 ******************************************/

(function ($, window, undefined) {

  var PLUGIN_NAME = "fabrikStrip",
      INSTANCE_KEY = "plugin_" + PLUGIN_NAME;

  var originalWindowHeight, originalWindowWidth;

  function FabrikStrip(element, options, defaults) {
      this.element = $(element);
      this.options = $.extend({}, defaults, options);
      this._defaults = defaults;
      this._init();
  }

  FabrikStrip.prototype = {

      goTo: function (index) {
          // Go to specific blade

          var self = this,
              bladesCount = $(self.options.bladesSelector).length;

          if (index > bladesCount - 1) {
              return;
          }

          $('button', $(self.options.pagerSelector)).show();

          if (index <= 0) {
              self.goToFirst();
          }
          else if (index >= bladesCount - 1) {
              self.goToLast();
          }
          else {
              var beforeWidth = 0;

              $(self.options.bladesSelector).each(function () {
                  var $blade = $(this);

                  if ($blade.index() < index) {
                      beforeWidth += $blade.width();
                  }
              });

              var viewableWidth = $(self.element[0]).width(),
                  halfView = (viewableWidth - $(self.options.bladesSelector).eq(index).width()) / 2,
                  pull = beforeWidth - halfView;

              this._setActive(index);
              this._setPull(-pull);

              this.options.afterChange(index);
              return index;
          }
      },

      goToFirst: function () {
          // Go to first blade
          $('.left', $(this.options.pagerSelector)).hide();
          this._setActive(0);
          this._setPull(0);

          this.options.afterChange(0);
          return 0;
      },

      goToLast: function () {
          // Go to last blade
          $('.right', $(this.options.pagerSelector)).hide();
          var pull = $(this.options.innerStripSelector).width() - $(this.element[0]).width(),
              index = $(this.options.bladesSelector).length - 1;

          this._setActive(index);
          this._setPull(-pull);

          this.options.afterChange(index);
          return index;
      },

      _init: function () {
          $('html').addClass('fabrik-strip');
          this._bind();
          this._setSizes();
          this._setActive(this.options.startIndex);
      },

      _windowResize: function () {

          var self = this;
          var h = $(window).height();
          var w = $(window).width();

          var heightChangeFactor = (h - originalWindowHeight) / originalWindowHeight;
          var widthChangeFactor = (w - originalWindowWidth) / originalWindowWidth;

          var containerHeight = $(self.element[0]).data('height');
          var newHeight = containerHeight + (containerHeight * heightChangeFactor);

          $(self.element[0]).css({ 'height': newHeight, 'max-height': newHeight });
          $(self.options.bladesSelector).removeAttr('style');
          $(self.options.innerStripSelector).width('999em');

          var totalWidth = 0;

          $(self.options.bladesSelector).each(function () {

              var $blade = $(this),
                  bladeDataWidth = $blade.data('width'),
                  bladeWidth = bladeDataWidth + (bladeDataWidth * widthChangeFactor);

              // limit blade width
              $blade.width(bladeWidth);

              // limit total width
              totalWidth += bladeWidth;
          });

          $(self.options.innerStripSelector).width(totalWidth);
      },

      _setSizes: function () {

          var self = this,
              windowHeight = $(window).height(),
              windowWidth = $(window).width();

          originalWindowHeight = windowHeight;
          originalWindowWidth = windowWidth;

          if ($(self.options.headerSelector).length) {
              windowHeight -= $(self.options.headerSelector).height();
          }

          $(self.element[0]).data('height', windowHeight).css({ 'height': windowHeight, 'max-height': windowHeight });
          $(self.options.bladesSelector).removeAttr('style');
          $(self.options.innerStripSelector).width('999em');

          // after images are loaded get the widths of the blades so we can set parent container
          if (imagesLoaded !== undefined) {
            imagesLoaded(self.element[0], function () {
              var width = 0;

              $(self.options.bladesSelector).each(function () {

                var $blade = $(this),
                    bladewidth = $(this).width(),
                    $img = $('img', $blade),
                    $video = $('video', $blade);

                if ($img.length) {
                  bladewidth = $img.width();
                  $blade.data('width', bladewidth).data('height', $img.height());
                }

                if ($video.length) {
                  bladewidth = $video.width();
                  $blade.data('width', bladewidth).data('height', $video.height());
                }

                $blade.width(bladewidth);
                width += bladewidth;
              });

              $(self.options.innerStripSelector).width(width).addClass('blades-loaded');
            });
          }
          else {
            console.info("You need to add images Loaded plugin http://imagesloaded.desandro.com/");
          }

          var pagerWidth = $('.left').outerWidth(true),
              infoWidth = windowWidth - pagerWidth;

          if (windowWidth >= 1200) {
              infoWidth = $(self.element[0]).width() / 2;
          }

          $('.project-info-blade').width(infoWidth);

      },

      _setPull: function (int) {
          $(this.options.innerStripSelector).css({
              "-webkit-transform": "translate3d(" + int + "px, 0px, 0px)",
              "-moz-transform": "translate3d(" + int + "px, 0px, 0px)",
              "-ms-transform": "translate3d(" + int + "px, 0px, 0px)",
              "-o-transform": "translate3d(" + int + "px, 0px, 0px)",
              "transform": "translate3d(" + int + "px, 0px, 0px)"
          });
      },

      _setActive: function (index) {
          $(this.options.bladesSelector).removeClass('active');
          // Get the new active blade
          var $blade = $(this.options.bladesSelector).eq(index);
          $blade.addClass('active');

          $(this.element[0]).data('activeIndex', index);
      },

      _goToOnResize: function (index) {
          var self = this;

          setTimeout(function () {
              self.goTo(index);
          }, 200);
      },

      _bind: function () {
          // debounced resizing
          var self = this, t;

          $('button', $(self.options.pagerSelector)).on('click', function (e) {
              e.preventDefault();

              var activeIndex = $(self.element[0]).data('activeIndex'),
                  index = activeIndex + 1;

              if ($(this).hasClass('left')) {
                  index = activeIndex - 1;
              }

              self.options.beforeChange(activeIndex);

              self.goTo(index);
          });

          $(self.options.bladesSelector).on('click', function (e) {

              if (!$(this).hasClass('active')) {
                  e.preventDefault();
                  var activeIndex = $(self.element[0]).data('activeIndex');
                  self.options.beforeChange(activeIndex);
                  self.goTo($(this).index());
              }
          });

          $(window).on('resize.' + PLUGIN_NAME, function () {
              clearTimeout(t);
              t = setTimeout(function () {
                  // On resize set the sizes
                  self._windowResize();
                  self._goToOnResize($(self.element[0]).data('activeIndex'));
              }, 200);
          });

          $(document.documentElement).keyup(function (event) {
              var activeIndex = 0,
                  index = 0;

              // handle cursor keys
              if (event.keyCode == 37) {
                  // go left
                  activeIndex = $(self.element[0]).data('activeIndex');
                  index = activeIndex - 1;

                  self.options.beforeChange(activeIndex);
                  self.goTo(index);
              } else if (event.keyCode == 39) {
                  // go right
                  activeIndex = $(self.element[0]).data('activeIndex');
                  index = activeIndex + 1;

                  self.options.beforeChange(activeIndex);
                  self.goTo(index);
              }
          });

      }

  };

  $.fn[PLUGIN_NAME] = function (options) {

      var args = arguments,
          returns;

      this.each(function () {

          var instance = $.data(this, INSTANCE_KEY);

          if (instance) {
              // check if invoking public methods
              if (typeof (options) === 'string' && options[0] !== '_') {
                  var method = instance[options];
                  if (typeof (method) === 'function') {
                      returns = method.apply(instance, Array.prototype.slice.call(args, 1));
                  } else {
                      // method missing
                      $.error('Public method \'' + options + '\' does not exist on jQuery.' + PLUGIN_NAME);
                  }
              }

          } else {
              $.data(this, INSTANCE_KEY, new FabrikStrip(this, options, $.fn[PLUGIN_NAME].defaults));
          }
      });

      // if the earlier cached method has a value return it, otherwise return this to preserve chainability
      return returns !== undefined ? returns : this;
  };

  $.fn[PLUGIN_NAME].defaults = {
      bladesSelector: '.blade',
      innerStripSelector: '.strip',
      headerSelector: null,
      pagerSelector: '.strip-pagers',
      startIndex: 0,
      afterChange: function () { },
      beforeChange: function () { },
  };


})(jQuery, window);