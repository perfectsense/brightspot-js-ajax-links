/**
 * This module/plugin will allow for convertion of plain links or forms to ajaxable content.
 * This can be used for use cases such as search results filtering, or where we might want to make an aside module a little more "dynamic"
 *
 * This HTML has a wrap class to place the content on the page which has the data attr to turn it into the plugin
 * Inside this div any links or forms that have data-ajax-link-target="selectorHere" will turn into ajaxable content.
 * The plugin will kill the click on that a element (or submit on the form), ajax in it's href (or action + serialized data)
 * and find the "selectorHere" div on the subsequent page.
 *
 * IMPORTANT: By default your ajaxed page HAS to have the "selectorHere" on it. That's how this code knows what to replace and where.
 * It does NOT assume that it's returning the entire Ajax result into the target. It finds the "selectorHere" on the ajax
 * result and gets it's contents. You can set the "fullPageAjax" to false, which WILL assume that it's returning the entire Ajax
 * result into target. If that is done, the BE needs to have the logic to only return the contents
 *
 * There are three loadType modes:
 * 1) replace (default) - This will replace the content of the "selectorHere" with what is Ajaxed in
 *
 * 2) append - This will simply append what is ajaxed here at the end of "selectorHere".
 *    This is a good mode if you have a infinite load type of experience, but your load more is
 *    somewhere outside and want to keep using it to add more content
 *
 * 3) loadMore - This is a more where we will append the Ajaxed in items to the end of "selectorHere", but we are assuming that you
 *    used a "loadMore" type button and the new content ALSO has that button. Therefore, we will delete the previous loadMore button
 *    This is a good mode if you have load more functionality, but it could end, so you want to bring the next load more button in
 *    with your ajax content. Once the ajaxed content doesn't have the load more, the user will have reached the end.
 *
 * You have the option to set data-bsp-ajax-links=-options to enable loadType (default: replace, optional: append, loadMore).
 * If append is used, the ajaxed "selectorHere" div will be placed after the original "selectorHere"
 * If loadMore is used, the link that was clicked on will be removed and the ajaxed the div will be placed after the original "selectorHere"
 *
 * You also have the option to enable history management. This works well for the "replace" loadType as when content gets replaced,
 * we will push URLs into history to maintain state, which will also enable the back button to re-ajax previous content.
 *
 * Lastly, we can add some additional params to the ajaxed URL. Let's say you want to add a _context to only get partial HTML or something
 * similar, you can do that by passing a JSON object to "extraParams" which will get serialized and added to the original link href
 *
 * Example HTML:
 * <div class="content-wrap" data-bsp-ajax-links>
 *      <div class="content">
 *          <a href="this-page-will-ajax-in.html" data-ajax-link-target=".content">
 *      </div>
 * </div>
 *
 */

import $ from 'jquery';
import bsp_utils from 'bsp-utils';
import historyAPI from 'native.history';
import bsp_autosubmit from 'bsp-autosubmit';

var bsp_ajax_links = {

    // by default, we will not replace history and use the replace method
    defaults: {
        loadingEvent : 'bsp-ajax-links:loading',
        loadedEvent : 'bsp-ajax-links:loaded',
        dataName : 'data-ajax-link-target',
        ajaxLinksClass : 'load-more',
        historyReplace : false,
        loadType : 'replace',
        fullPageAjax : true,
        extraParams : {}
    },

    init: function($el, options) {

        var self = this;
        self.$el = $el;
        self.settings = $.extend({}, self.defaults, options);

        // if we are replacing history, we have to create the listener
        if(self.settings.historyReplace) {
            self._createHistoryListener();
        }

        self.replaceNativeActionWithAjax(self.$el);

    },

    // if we are replacing history, everything is based off of the history change. Instead of
    // ajaxing content ourselves, we just change history and let the listener do the correct ajaxing for us
    _createHistoryListener() {
        var self = this;

        History.Adapter.bind(window,'statechange',function(){
            var state = History.getState();

            if (state.data.target) {

                self.ajaxInContent({
                    target : state.data.target,
                    href : state.cleanUrl,
                    $link : state.data.$link || false
                });

            }

        });
    },

    // This is the helper function to crawl through the DOM context and find any targeted clicks
    // and turn them into ajax or history events.
    // We run this function natively, as when we are done with ajaxing in the new content, we run it
    // again in the new context to pick up any newly targeted clicks
    replaceNativeActionWithAjax($context) {
        var self = this;

        // context is a list of items, we want the parent container to find the link.
        var $ajaxLinks = $context.first().parent().find('[' + self.settings.dataName + ']');
        $ajaxLinks.each(function () {
            var $this = $(this);

            // used to check whether we are a form or link
            var isForm = false;

            // save off the link target and href
            var linkTarget = $(this).attr(self.settings.dataName);
            var linkHref = $(this).attr('href');

            // if there is no href and we have an action, then great, we are a form, make the action our "href"
            // if we have no href and are not a form then WTF, so get out
            if(!linkHref) {
                if ($this.attr('action')) {
                    linkHref = $(this).attr('action');
                    isForm = true;
                } else {
                    return false;
                }
            }

            // TODO: Clean this up a bit to have more helper functions and not repeat the same code
            if(isForm) {

                // if we are a form, we will act on our submit event
                $this.on('submit', function(e) {
                    e.preventDefault();

                    // serialize our data, we will need to pass it along with our original action
                    var formData = $this.serialize();

                    // we need to extend the url params we might have already had with the
                    // form params we picked up
                    var linkParams = linkHref.split('?')[1] || linkHref.split('?')[0];
                    var urlParams = self._getParams(linkParams);
                    var formParams = self._getParams(formData);
                    formParams = $.extend({},urlParams,formParams);

                    // once we have that use jquery native to turn them into a URL string
                    formData = $.param(formParams);

                    // grab the original URL and kill the ? since we already pulled that and extended it
                    linkHref = linkHref.split('?')[0] || linkHref.split('?')[1];

                    // create the plain link along with the new combined form data
                    linkHref += '?' + formData;

                    // if we are set to replace the history, we won't ajax. Instead we will pushState the new
                    // target, load type, and link.
                    // if we are not replacing history, just go ahead and perform the ajax
                    if(self.settings.historyReplace) {

                        var state = History.getState();

                        // if we are here for the first time, that means right now we have no "state" so we are
                        // the original page. Which means we will not know what to do if the user comes all the way back
                        // in that case, we replace our current state with one with actual state, so we WILL know what to do
                        if (!state.data.target) {
                            History.replaceState({
                                target : linkTarget,
                            },'', window.location.href);
                        }

                        History.pushState({
                            target : linkTarget,
                        },'', linkHref);

                    } else {
                        self.ajaxInContent({
                            target : linkTarget,
                            href : linkHref
                        });
                    }

                });

            } else {

                // for links, we act on the click itself
                $this.on('click', function(e) {
                    e.preventDefault();

    	            // this link might change between page loads
	                var linkHref = $(this).attr('href');

                    // if we are set to replace the history, we won't ajax. Instead we will pushState the new
                    // target, load type, and link.
                    // if we are not replacing history, just go ahead and perform the ajax
                    if(self.settings.historyReplace) {

                        // if we are here for the first time, that means right now we have no "state" so we are
                        // the original page. Which means we will not know what to do if the user comes all the way back
                        // in that case, we replace our current state with one with actual state, so we WILL know what to do
                        if (!state.data.target) {
                            History.replaceState({
                                target : linkTarget,
                            },'', window.location.href);
                        }

                        // unlike before, we want to save the link here. In case we are a "loadMore" type, we will
                        // delete the $link to have a smooth infinite load more functionality
                        History.pushState({
                            target : linkTarget,
                            $link : $this
                        },'', linkHref);

                    } else {

                        // unlike before, we want to save the link here. In case we are a "loadMore" type, we will
                        // delete the $link to have a smooth infinite load more functionality
                        self.ajaxInContent({
                            target : linkTarget,
                            href : linkHref,
                            $link : $this
                        });

                    }
                });

            }

        });

        self.$el.trigger(self.settings.loadedEvent, [$context]);
    },

    _getParams(prmstr) {

        // shamelessly stole this off of stackoverflow to get this moving.
        // TODO: We need to add string get params to bsp-utils, or create a string utility JS repo for things like this
        prmstr = prmstr.split('?')[0] || prmstr.split('?')[1];

        var params = {};
        var prmarr = prmstr.split("&");
        for ( var i = 0; i < prmarr.length; i++) {
            var tmparr = prmarr[i].split("=");
            params[tmparr[0]] = tmparr[1];
        }
        return params;

    },

    // our helper that does the actual ajaxing and replacing/appending of content
    ajaxInContent(options) {

        var self = this;
        var $target = $(options.target + ":last");
        var extraParams = '';

        // once we start ajaxing, we want to add this so we can do pretty CSS loading animations
        $target.addClass('bsp-loading-ajax');
        self.$el.trigger(self.settings.loadingEvent, [$target]);


        // if we are a replace type, kill the contents of the content (but leave the div in place, we replace it later)
        if(self.settings.loadType === 'replace') {
            $target.html('');
        } else {
            if(self.settings.loadType === 'loadMore') {
                if(options.$link) {
                    options.$link.remove();
                }
            }
        }

        // process the extraParams that might have been passed in
        if(typeof(self.settings.extraParams) === 'object') {
            $.each(self.settings.extraParams, function(key, value) {
                extraParams += '&' + key + '=' + value;
            });

            if(options.href.indexOf('?') === -1) {
                extraParams = extraParams.replace('&','?');
            }
        } else {
            extraParams = '';
        }

        // Ajax in the URL with any extra params if necessary
        $.get(options.href+extraParams, function(data) {

            if(self.settings.fullPageAjax) {
                // here we sanitize the data. In case we only got the content div without any parents, we add a parent so
                // can call a nice clean .find to get our clean data
                var $div = $('<div>');
                var $data = $div.html(data);
                // here we try to find our target inside our temporary parent
                // in case we do not find our target, we essentially make the assumption that fullPageAjax option was
                // incorrect and we got just our target contents
                var cleanData = $div.find(options.target).html() || data;
            } else {
                cleanData = data;
            }

            // used as context for searching new content if we are not replacing
            var $newContent;

            // something went wrong and we do not have data at this point, we ajaxed something weird or
            // we couldn't find out selector in the AJAX results, or something else bad happened.
            // We will instead of replacing/appending the data, just head over to the page we were supposed to ajax
            // This should be either the form action with serialized data or the link we were supposed to ajax in
            // Should be a good result for the user either way, as the BE should load the page they want
            if(!cleanData.length) {
                window.location.href = options.href;
            }

            // we are no longer loading, the content is about to hit the DOM
            $target.removeClass('bsp-loading-ajax');

            // if we are replace type, go ahead and replace and then we just research our original container
            // as we replaced everything
            if(self.settings.loadType == 'replace') {
                $target.html(cleanData);
                self.replaceNativeActionWithAjax($target);
            } else {

                if(self.settings.loadType == 'append') {
                    // We are appending, we just dump in new stuff and we are done
                    $newContent = $(cleanData).appendTo($target);
                    self.replaceNativeActionWithAjax($newContent);
                    return;
                }

                if(self.settings.loadType == 'loadMore')  {
                    // We are appending, we dump in new stuff at the end
                    // we also want to remove the loadMore link that we just used to get more
                    self.$el.find('.' + self.settings.ajaxLinksClass).remove();
                    $newContent = $(cleanData).appendTo($target);
                    self.replaceNativeActionWithAjax($newContent);
                    return;
                }

            }

        });

    }


};

export default bsp_ajax_links;
