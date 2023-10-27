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

            $("button", $(self.options.pagerSelector)).show();

            if (index <= 0) {
                self.goToFirst();
            } else if (index >= bladesCount - 1) {
                self.goToLast();
            } else {
                var beforeWidth = 0;

                $(self.options.bladesSelector).each(function () {
                    var $blade = $(this);

                    if ($blade.index() < index) {
                        beforeWidth += $blade.width();
                    }
                });

                var viewableWidth = $(self.element[0]).width(),
                    halfView =
                        (viewableWidth -
                            $(self.options.bladesSelector).eq(index).width()) /
                        2,
                    pull = beforeWidth - halfView;

                this._setActive(index);
                this._setPull(-pull);

                this.options.afterChange(index);
                return index;
            }
        },

        goToFirst: function () {
            // Go to first blade
            $(".left", $(this.options.pagerSelector)).hide();
            this._setActive(0);
            this._setPull(0);

            this.options.afterChange(0);
            return 0;
        },

        goToLast: function () {
            // Go to last blade
            $(".right", $(this.options.pagerSelector)).hide();
            var pull =
                    $(this.options.innerStripSelector).width() -
                    $(this.element[0]).width(),
                index = $(this.options.bladesSelector).length - 1;

            this._setActive(index);
            this._setPull(-pull);

            this.options.afterChange(index);
            return index;
        },

        _init: function () {
            document.documentElement.classList.add("fabrik-strip");
            this._bind();
            this._setSizes();
            this._setActive(this.options.startIndex);
        },

        _windowResize: function () {
            var self = this;
            var h = window.innerHeight;
            var w = window.innerWidth;

            var originalWindowHeight = self.element[0].dataset.height;

            var heightChangeFactor =
                (h - originalWindowHeight) / originalWindowHeight;

            self.element[0].dataset.height = h;
            self.element[0].dataset.width = w;

            self.element[0].style.height = `${h}px`;
            self.element[0].style.maxHeight = `${h}px`;

            document
                .querySelectorAll(self.options.bladesSelector)
                .forEach(function (blade) {
                    blade.removeAttribute("style");
                });

            document.querySelector(
                self.options.innerStripSelector
            ).style.width = "999em";

            var totalWidth = 0;

            document
                .querySelectorAll(self.options.bladesSelector)
                .forEach(function (blade) {
                    var bladeWidth = parseInt(blade.dataset.width);

                    if (bladeWidth && blade.dataset.media) {
                        bladeWidth = bladeWidth * (1 + heightChangeFactor);
                        blade.style.width = `${bladeWidth}px`;
                    } else if (bladeWidth) {
                        blade.style.width = `${bladeWidth}px`;
                    }

                    // limit total width
                    totalWidth = totalWidth + bladeWidth;
                });

            setTimeout(function () {
                document.querySelector(
                    self.options.innerStripSelector
                ).style.width = `${totalWidth}px`;
            }, 200);
        },

        _setSizes: function () {
            var self = this,
                windowHeight = window.innerHeight,
                windowWidth = window.innerWidth;

            if ($(self.options.headerSelector).length) {
                windowHeight -= $(self.options.headerSelector).height();
            }

            self.element[0].dataset.height = windowHeight;
            self.element[0].dataset.width = windowWidth;

            self.element[0].style.height = `${windowHeight}px`;
            self.element[0].style.maxHeight = `${windowHeight}px`;

            document
                .querySelectorAll(self.options.bladesSelector)
                .forEach(function (blade) {
                    blade.removeAttribute("style");
                });

            document.querySelector(
                self.options.innerStripSelector
            ).style.width = "999em";

            let width = 0;
            let inner = document.querySelector(self.options.innerStripSelector);

            // after images are loaded get the widths of the blades so we can set parent container
            if (imagesLoaded !== undefined) {

                var imgLoad = imagesLoaded(self.element[0]);
                
                imgLoad.on("progress", function (instance, image) 
                {
                    var result = image.isLoaded ? "loaded" : "broken";

                    console.log("image is " + result + " for " + image.img.src);

                    const parentBlade = image.closest(self.options.bladesSelector);

                    if (!image.isLoaded) {
                        parentBlade.style.display = 'none';
                    }
                    else {

                        parentBlade.dataset.media = true;
                        parentBlade.dataset.height = img.offsetHeight;
                        parentBlade.dataset.width = img.offsetWidth;
                        parentBlade.style.width = `${img.offsetWidth}px`;

                        width += img.offsetWidth;

                        inner.style.width = `${width}px`;
                    }
                });

                // imagesLoaded(self.element[0], function () {
                //     let width = 0;

                //     document.querySelectorAll(self.options.bladesSelector).forEach(function (blade) {
                //         let bladewidth = blade.offsetWidth,
                //             img = blade.querySelector("img"),
                //             video = blade.querySelector("video");

                //         if (img) {
                //             blade.dataset.media = true;
                //             bladewidth = img.offsetWidth;
                //             blade.dataset.height = img.offsetHeight;
                //         }

                //         if (video) {
                //             blade.dataset.media = true;
                //             bladewidth = video.offsetWidth;
                //             blade.dataset.height = video.offsetHeight;
                //         }

                //         blade.style.width = `${bladewidth}px`;
                //         blade.dataset.width = parseInt(bladewidth);
                //         width += bladewidth;
                //     });

                //     let inner = document.querySelector(self.options.innerStripSelector);
                //     inner.style.width = `${width}px`;
                //     inner.classList.add("blades-loaded");
                // });
            } 
            else {
                console.info(
                    "You need to add images Loaded plugin http://imagesloaded.desandro.com/"
                );
            }

            const videos = document.querySelectorAll(`${self.options.bladesSelector} video`);

            if (videos.length) {
                videos.forEach(function (video) {
                    video.addEventListener('loadeddata', () => {
                        
                        const videoParentBlade = video.closest(self.options.bladesSelector);

                        videoParentBlade.dataset.media = true;
                        videoParentBlade.dataset.height = video.offsetHeight;
                        videoParentBlade.dataset.width = video.offsetWidth;
                        videoParentBlade.style.width = `${video.offsetWidth}px`;

                        width += video.offsetWidth;

                        inner.style.width = `${width}px`;
                    });
                });
            }

            var pagerWidth = $(".left").outerWidth(true),
                infoWidth = windowWidth - pagerWidth;

            if (windowWidth >= 1200) {
                infoWidth = self.element[0].offsetWidth / 2;
            }

            document.querySelector(".project-info-blade").style.width = `${infoWidth}px`;

            width += infoWidth;
            inner.style.width = `${width}px`;
        },

        _setPull: function (int) {
            $(this.options.innerStripSelector).css({
                "-webkit-transform": "translate3d(" + int + "px, 0px, 0px)",
                "-moz-transform": "translate3d(" + int + "px, 0px, 0px)",
                "-ms-transform": "translate3d(" + int + "px, 0px, 0px)",
                "-o-transform": "translate3d(" + int + "px, 0px, 0px)",
                transform: "translate3d(" + int + "px, 0px, 0px)",
            });
        },

        _setActive: function (index) {
            $(this.options.bladesSelector).removeClass("active");
            // Get the new active blade
            var $blade = $(this.options.bladesSelector).eq(index);
            $blade.addClass("active");

            $(this.element[0]).data("activeIndex", index);
        },

        _goToOnResize: function (index) {
            var self = this;

            setTimeout(function () {
                self.goTo(index);
            }, 200);
        },

        _bind: function () {
            // debounced resizing
            var self = this,
                t;

            $("button", $(self.options.pagerSelector)).on(
                "click",
                function (e) {
                    e.preventDefault();

                    var activeIndex = $(self.element[0]).data("activeIndex"),
                        index = activeIndex + 1;

                    if ($(this).hasClass("left")) {
                        index = activeIndex - 1;
                    }

                    self.options.beforeChange(activeIndex);

                    self.goTo(index);
                }
            );

            $(self.options.bladesSelector).on("click", function (e) {
                if (!$(this).hasClass("active")) {
                    e.preventDefault();
                    var activeIndex = $(self.element[0]).data("activeIndex");
                    self.options.beforeChange(activeIndex);
                    self.goTo($(this).index());
                }
            });

            var t;
            $(window).on("resize." + PLUGIN_NAME, function () {
                clearTimeout(t);
                t = setTimeout(function () {
                    // On resize set the sizes
                    self._windowResize();
                    self._goToOnResize($(self.element[0]).data("activeIndex"));
                }, 200);
            });

            $(document.documentElement).on("keydown", function (event) {
                var activeIndex = 0,
                    index = 0;

                // handle cursor keys
                if (event.which == 37) {
                    // go left
                    activeIndex = $(self.element[0]).data("activeIndex");
                    index = activeIndex - 1;

                    self.options.beforeChange(activeIndex);
                    self.goTo(index);
                } else if (event.which == 39) {
                    // go right
                    activeIndex = $(self.element[0]).data("activeIndex");
                    index = activeIndex + 1;

                    self.options.beforeChange(activeIndex);
                    self.goTo(index);
                }
            });
        },
    };

    $.fn[PLUGIN_NAME] = function (options) {
        var args = arguments,
            returns;

        this.each(function () {
            var instance = $.data(this, INSTANCE_KEY);

            if (instance) {
                // check if invoking public methods
                if (typeof options === "string" && options[0] !== "_") {
                    var method = instance[options];
                    if (typeof method === "function") {
                        returns = method.apply(
                            instance,
                            Array.prototype.slice.call(args, 1)
                        );
                    } else {
                        // method missing
                        $.error(
                            "Public method '" +
                                options +
                                "' does not exist on jQuery." +
                                PLUGIN_NAME
                        );
                    }
                }
            } else {
                $.data(
                    this,
                    INSTANCE_KEY,
                    new FabrikStrip(this, options, $.fn[PLUGIN_NAME].defaults)
                );
            }
        });

        // if the earlier cached method has a value return it, otherwise return this to preserve chainability
        return returns !== undefined ? returns : this;
    };

    $.fn[PLUGIN_NAME].defaults = {
        bladesSelector: ".blade",
        innerStripSelector: ".strip",
        headerSelector: null,
        pagerSelector: ".strip-pagers",
        startIndex: 0,
        afterChange: function () {},
        beforeChange: function () {},
    };
})(jQuery, window);
