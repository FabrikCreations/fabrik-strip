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

            var self = this,
                h = window.innerHeight,
                w = window.innerWidth;

            self.strip.dataset.height = h;
            self.strip.dataset.width = w;

            self.strip.style.height = `${h}px`;
            self.strip.style.maxHeight = `${h}px`;

            BLADES.forEach((blade) => {
                blade.removeAttribute("style");
            });

            self.stripInner.style.width = "30000px";

            var totalWidth = 0;

            BLADES.forEach((blade) => {

                if (blade.dataset.media && blade.dataset.widthFactor) {
                    bladeWidth = parseFloat(self.strip.dataset.height) * parseFloat(blade.dataset.widthFactor);
                    blade.style.width = `${bladeWidth}px`;
                } 
                // else if (bladeWidth) {
                //     blade.style.width = `${bladeWidth}px`;
                // }

                // limit total width
                totalWidth = totalWidth + bladeWidth;
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

            let width = 0;

            const images = document.querySelectorAll(`${self.options.bladesSelector} img`);

            console.log('image count', images.length);

            // after images are loaded get the widths of the blades so we can set parent container
            if (imagesLoaded !== undefined) {

                var imgLoad = imagesLoaded(self.strip);
                
                imgLoad.on("progress", function (instance, image) 
                {
                    var result = image.isLoaded ? "loaded" : "broken";

                    console.log("image is " + result + " for " + image.img.src);

                    const img = image.img;
                    const parentBlade = img.closest(self.options.bladesSelector);

                    if (!parentBlade.classList.contains('project-info-blade')) 
                    {
                        if (!image.isLoaded) {
                            parentBlade.remove();
                            BLADES = document.querySelectorAll(this.options.bladesSelector);
                        }
                        else {

                            setTimeout(() => {
                                const imageHeight = self.strip.offsetHeight;
                                const widthFactor = img.naturalWidth / img.naturalHeight;
                                const imageWidth = imageHeight * widthFactor;
                                
                                parentBlade.dataset.media = true;
                                parentBlade.dataset.height = imageHeight;
                                parentBlade.dataset.width = imageWidth;
                                parentBlade.dataset.widthFactor = widthFactor;
                                parentBlade.style.width = `${imageWidth}px`;

                                width += imageWidth;

                                console.log("width of image", imageWidth, "running total", width)
                                
                                parentBlade.classList.add("blade-loaded");
                            }, 350);
                        }
                    }
                });
            } 
            else {
                console.info(
                    "You need to add images Loaded plugin http://imagesloaded.desandro.com/"
                );
            }

            const videos = document.querySelectorAll(`${self.options.bladesSelector} video`);
            let videosCount = videos.length;
            let loadedVideosCount = 0;

            console.log('video count', videosCount);

            if (videosCount) {

                videos.forEach((video) => {

                    const videoParentBlade = video.closest(self.options.bladesSelector);

                    if (!videoParentBlade.classList.contains('project-info-blade')) 
                    {
                        video.addEventListener('error', (e) => {
                            console.log("video is broken for " + e.target.attributes.src.value);
                            videosCount--;

                            videoParentBlade.remove();
                            BLADES = document.querySelectorAll(this.options.bladesSelector);
                        }, true);

                        video.addEventListener('loadeddata', (e) => {

                            console.log("video is loaded for " + e.target.currentSrc);

                            let videoHeight = self.strip.offsetHeight;
                            let widthFactor = video.videoWidth / video.videoHeight;
                            let videoWidth = videoHeight * widthFactor;

                            videoParentBlade.dataset.media = true;
                            videoParentBlade.dataset.height = videoWidth;
                            videoParentBlade.dataset.width = videoWidth;
                            videoParentBlade.dataset.widthFactor = widthFactor;
                            videoParentBlade.style.width = `${videoWidth}px`;

                            width += videoWidth;

                            console.log("width of video", videoWidth, "running total", width)

                            videoParentBlade.classList.add("blade-loaded");

                            loadedVideosCount++;
                        });
                    }
                });
            }

            var pagerWidth = self.buttonNext.offsetWidth,
                infoWidth = windowWidth - pagerWidth;

            if (windowWidth >= 1200) {
                infoWidth = self.strip.offsetWidth / 2;
            }

            const infoBlade = document.querySelector(".project-info-blade");
            infoBlade.style.width = `${infoWidth}px`;

            infoBlade.dataset.width = infoBlade.offsetWidth;
            infoBlade.classList.add("blade-loaded");

            width += infoBlade.offsetWidth;
            console.log("width of info", infoBlade.offsetWidth, "running total", width)


            if (images.length && videosCount) {                
                imgLoad.on('always', () => {
                    setTimeout(() => {
                        console.log('total width images waiting for videos', width);
                        checkVideosLoaded(); 
                    }, 350);
                });
            }
            else if (images.length) {
                imgLoad.on('always', () => {
                    setTimeout(() => {
                        console.log('total width images', width);
                        self.stripInner.style.width = `${width}px`;
                    }, 350);
                });
            }
            else if (videosCount) {
                checkVideosLoaded();
            }
            else {
                self.stripInner.style.width = `${width}px`;
            }

            function checkVideosLoaded() {
                console.log('checking videos loaded');

                const intervalId = setInterval(() => {

                    console.log('video count', videosCount, 'loaded video count', loadedVideosCount);

                    if (videosCount === loadedVideosCount) {
                        clearInterval(intervalId); // Stop the interval if the numbers match
                        self.stripInner.style.width = `${width}px`;
                        console.log('total width with videos', width);
                    }
                }, 150);

                setTimeout(() => {
                    clearInterval(intervalId);
                }, 5000);
            }
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
                if (event.key == 37) {
                    // go prev
                    activeIndex = parseInt(self.strip.dataset.activeIndex);
                    index = activeIndex - 1;

                    self.options.beforeChange(activeIndex);
                    self.goTo(index);
                } else if (event.key == 39) {
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
        innerStripSelector: ".strip",
        headerSelector: null,
        pagerSelector: ".strip-pagers",
        startIndex: 0,
        afterChange: function () {},
        beforeChange: function () {},
    };
})(jQuery, window);