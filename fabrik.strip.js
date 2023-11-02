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
        INSTANCE_KEY = "plugin_" + PLUGIN_NAME,
        BLADES;

    function FabrikStrip(element, options, defaults) {

        this.options = Object.assign({}, defaults, options);
        this._defaults = defaults;

        this.strip = element;
        this.stripInner = document.querySelector(this.options.innerStripSelector);
        
        this.buttons = document.querySelectorAll(this.options.pagerSelector + " button");
        this.buttonNext = document.querySelector(this.options.pagerSelector + " .right");
        this.buttonPrev = document.querySelector(this.options.pagerSelector + " .left");

        this.stripWidth = 0;
        this.mediaCount = 0;
        this.displayedMediaCount = 0;

        this._init();
    }

    FabrikStrip.prototype = {
        goTo: function (index) {

            // Go to specific blade
            var self = this;

            if (index > BLADES.length - 1) {
                return;
            }

            self.buttons.forEach(function(button) {
                button.style.display = "block";
            });

            if (index <= 0) {
                self.goToFirst();
            } else if (index >= BLADES.length - 1) {
                self.goToLast();
            } else {
                var beforeWidth = 0;

                BLADES.forEach((blade, bladeIndex) => {
                    if (bladeIndex < index) {
                        beforeWidth += blade.offsetWidth;
                    }
                });

                var viewableWidth = self.strip.offsetWidth,
                    halfView = (viewableWidth - BLADES[index].offsetWidth) /  2,
                    pull = beforeWidth - halfView;
                

                const maxPull = self.stripInner.offsetWidth - viewableWidth;

                if (pull > maxPull) {
                    pull = maxPull;
                }

                this._setActive(index);
                this._setPull(-pull);
                this.options.afterChange(index);

                return index;
            }
        },

        goToFirst: function () {
            // Go to first blade
            this.buttonPrev.style.display = "none";
            this._setActive(0);
            this._setPull(0);
            this.options.afterChange(0);

            return 0;
        },

        goToLast: function () {
            // Go to last blade
            this.buttonNext.style.display = "none";

            const pull = this.stripInner.offsetWidth - this.strip.offsetWidth,
                index = BLADES.length - 1;

            this._setActive(index);
            this._setPull(-pull);

            this.options.afterChange(index);
            return index;
        },

        _init: function () {
            document.documentElement.classList.add("fabrik-strip");
            BLADES = document.querySelectorAll(this.options.bladesSelector);
            this._bind();
            this._setSizes();
            this._setActive(this.options.startIndex);
        },

        _windowResize: function () {

            const self = this;

            self.strip.dataset.height = window.innerHeight;
            self.strip.dataset.width = window.innerWidth;

            self.strip.style.height = `${window.innerHeight}px`;
            self.strip.style.maxHeight = `${window.innerHeight}px`;

            BLADES.forEach((blade) => {
                blade.removeAttribute("style");
            });

            self.stripInner.style.width = "30000px";

            var totalWidth = 0;

            BLADES.forEach((blade) => {

                if (blade.dataset.media && blade.dataset.widthFactor) {
                    bladeWidth = parseFloat(self.strip.dataset.height) * parseFloat(blade.dataset.widthFactor);
                    blade.style.width = `${bladeWidth}px`;
                    console.log('media blade width', bladeWidth);
                } 
                else {
                    bladeWidth = parseFloat(blade.dataset.width);
                    console.log('normal blade width', parseFloat(bladeWidth));
                }

                // limit total width
                totalWidth += bladeWidth;
            });

            setTimeout(function () {
                self.stripInner.style.width = `${totalWidth}px`;
            }, 200);
        },

        _setSizes: function () {
            var self = this,
                windowHeight = window.innerHeight,
                windowWidth = window.innerWidth;

            if ($(self.options.headerSelector).length) {
                windowHeight -= $(self.options.headerSelector).height();
            }

            self.strip.dataset.height = windowHeight;
            self.strip.dataset.width = windowWidth;

            self.strip.style.height = `${windowHeight}px`;
            self.strip.style.maxHeight = `${windowHeight}px`;

            BLADES.forEach((blade) => {
                blade.removeAttribute("style");
            });

            self.stripInner.style.width = "30000px";

            const mediaList = document.querySelectorAll(self.options.bladesMediaSelector);
            self.mediaCount = mediaList.length;

            console.log('media count', self.mediaCount);

            mediaList.forEach((mediaItem) => {
                mediaItem.classList.add('loaded');
                const parentBlade = mediaItem.closest(self.options.bladesSelector);

                if (mediaItem.nodeName === "IMG") 
                {
                    let imgLoopCounter = 0;

                    function runImgLoop() {

                        const hasImageDimensions = mediaItem.naturalWidth;
                        console.log('has image dimensions', hasImageDimensions);

                        if (!hasImageDimensions && imgLoopCounter <= 12) {
                            imgLoopCounter++;
                            setTimeout(runImgLoop, 250); 
                        }
                        else {
                            if (imgLoopCounter > 12) {
                                console.log('image could not be loaded in time');
                            }
                            parentBlade.classList.add('loaded');
                            self._getImageDimensions(mediaItem, parentBlade);
                        }
                    }

                    setTimeout(runImgLoop, 250); 
                }
                else if (mediaItem.nodeName === "VIDEO")
                {
                    let vidLoopCounter = 0;

                    function runVidLoop() {

                        const hasVideoDimensions = mediaItem.videoWidth;
                        console.log('has video dimensions', hasVideoDimensions);

                        if (!hasVideoDimensions && vidLoopCounter <= 20) {
                            vidLoopCounter++;                            
                            setTimeout(runVidLoop, 250); 
                        }
                        else {
                            if (vidLoopCounter > 20) {
                                console.log('video could not be loaded in time');
                            }
                            self._getVideoDimensions(mediaItem, parentBlade);
                        }
                    }

                    setTimeout(runVidLoop, 250); 
                }
            });

            const infoBlade = document.querySelector(".project-info-blade");

            if (infoBlade) {

                var pagerWidth = self.buttonNext.offsetWidth,
                    infoWidth = windowWidth - pagerWidth;

                if (windowWidth >= 1200) {
                    infoWidth = self.strip.offsetWidth / 2;
                }

                
                infoBlade.style.width = `${infoWidth}px`;
                infoBlade.dataset.width = infoBlade.offsetWidth;
                infoBlade.classList.add("blade-loaded");

                self.stripWidth += infoBlade.offsetWidth;
                console.log("width of info", infoBlade.offsetWidth, "running total", self.stripWidth);
            }

            if (mediaList.length) {
                self._checkMediaLoaded(mediaList.length);
            }
            else {
                self.stripInner.style.width = `${self.stripWidth}px`;
            }
        },

        _checkMediaLoaded: function() {
            console.log('checking media loaded');

            const intervalId = setInterval(() => {

                console.log('media count', this.mediaCount, 'displayed media count', this.displayedMediaCount);

                if (this.mediaCount === this.displayedMediaCount) {
                    clearInterval(intervalId); // Stop the interval if the numbers match
                    this.stripInner.style.width = `${this.stripWidth}px`;
                    console.log('total width with media', this.stripWidth);
                }
            }, 250);
        },

        _getImageDimensions: function (img, parent)  {

            const imgHeight = this.strip.offsetHeight;
            let imageWidthFactor = img.naturalWidth / img.naturalHeight;
            let imageWidth = imgHeight * imageWidthFactor;

            if (isNaN(imageWidth)) {
                imageWidth = imgHeight;
                imageWidthFactor = 1;
            }
            
            parent.dataset.media = true;
            parent.dataset.height = imgHeight;
            parent.dataset.width = imageWidth;
            parent.dataset.widthFactor = imageWidthFactor;
            parent.style.width = `${imageWidth}px`;

            this.stripWidth += imageWidth;
            this.displayedMediaCount++;

            console.log("width of image", imageWidth, "running total", this.stripWidth);
        },

        _getVideoDimensions: function (video, parent)  {

            const videoHeight = this.strip.offsetHeight;
            let videoWidthFactor = video.videoWidth / video.videoHeight;
            let videoWidth = videoHeight * videoWidthFactor;

            if (isNaN(videoWidth)) {
                videoWidthFactor = 1.7777777778;
                videoWidth = videoHeight * videoWidthFactor;
            }

            parent.dataset.media = true;
            parent.dataset.height = videoHeight;
            parent.dataset.width = videoWidth;
            parent.dataset.widthFactor = videoWidthFactor;
            parent.style.width = `${videoWidth}px`;

            this.stripWidth += videoWidth;                              
            this.displayedMediaCount++;

            console.log("width of video", videoWidth, "running total", this.stripWidth)
        },

        _setPull: function (int) {
            this.stripInner.style.webkitTransform = `translate3d(${int}px, 0px, 0px)`;
            this.stripInner.style.MozTransform = `translate3d(${int}px, 0px, 0px)`;
            this.stripInner.style.msTransform = `translate3d(${int}px, 0px, 0px)`;
            this.stripInner.style.oTransform = `translate3d(${int}px, 0px, 0px)`;
            this.stripInner.style.transform = `translate3d(${int}px, 0px, 0px)`;
        },

        _setActive: function (index) {

            BLADES.forEach(blade => {
                blade.classList.remove("active");
            });

            BLADES[index].classList.add("active");
            this.strip.dataset.activeIndex = index;
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

            self.buttons.forEach((button) => {

                button.addEventListener('click', (e) => {
                    e.preventDefault();

                    self.strip.dataset

                    var activeIndex = parseInt(self.strip.dataset.activeIndex),
                        index = activeIndex + 1;

                    if (button.classList.contains('left')) {
                        index = activeIndex - 1;
                    }

                    self.options.beforeChange(activeIndex);

                    self.goTo(index);
                });
            });

            BLADES.forEach((blade, bladeIndex) => {
                blade.addEventListener('click', (e) => {
                    if (!blade.classList.contains('active')) {
                        e.preventDefault();
                        var activeIndex = parseInt(self.strip.dataset.activeIndex);
                        self.options.beforeChange(activeIndex);
                        self.goTo(bladeIndex);
                    }
                });
            });

            window.addEventListener("resize", () => {
                clearTimeout(t);
                t = setTimeout(function () {
                    // On resize set the sizes
                    self._windowResize();
                    self._goToOnResize(parseInt(self.strip.dataset.activeIndex));
                }, 200);
            });

            document.documentElement.addEventListener("keydown", (event) => {

                var activeIndex = 0,
                    index = 0;

                // handle cursor keys
                if (event.key == "ArrowLeft") {
                    // go prev
                    activeIndex = parseInt(self.strip.dataset.activeIndex);
                    index = activeIndex - 1;

                    self.options.beforeChange(activeIndex);
                    self.goTo(index);
                } else if (event.key  == "ArrowRight") {
                    // go next
                    activeIndex = parseInt(self.strip.dataset.activeIndex);
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
                        returns = method.apply(instance,Array.prototype.slice.call(args, 1));
                    } else {
                        // method missing
                        $.error("Public method '" + options + "' does not exist on jQuery." + PLUGIN_NAME);
                    }
                }
            } else {
                $.data(this,INSTANCE_KEY,new FabrikStrip(this, options, $.fn[PLUGIN_NAME].defaults));
            }
        });

        // if the earlier cached method has a value return it, otherwise return this to preserve chainability
        return returns !== undefined ? returns : this;
    };

    $.fn[PLUGIN_NAME].defaults = {
        bladesSelector: ".blade",
        bladesMediaSelector: ".blade > img, .blade > video, .blade > .blade-video-link > video, .blade > .blade-video-link > img",
        innerStripSelector: ".strip",
        headerSelector: null,
        pagerSelector: ".strip-pagers",
        startIndex: 0,
        afterChange: function () {},
        beforeChange: function () {},
    };
})(jQuery, window);