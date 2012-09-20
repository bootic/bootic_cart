/*  bootic_cart.js, version 0.0.1

Copyright (c) 2012 Ismael Celis for Bootic S.P.A. (http://bootic.net)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
------------------------------------------------------------------*/
// Declare global namespace
var Bootic = Bootic || {};

// Wrap everything in a closure
;(function (window, $) {

// Events module
// =============
// 
// Wrap our own objects in jQuery's .bind() and .trigger() methods.
//
// Usage:
//     var MyObject = {...}
//     $.extend(MyObject, Events)
//     MyObject.bind('foo', function (evt, i) { alert(i)})
//     MyObject.trigger('foo', [1])
var Events = {
  track: function (eventName) {
    if('Bootic' in window && 'track' in window.Bootic) {
      Bootic.track('Bootic.Cart:' + eventName)
    }
  },
  
  bind: function (eventName, fn) {
    $(this).bind(eventName, fn)
    return this
  },
  
  trigger: function (eventName, data) {
    this.track(eventName)
    $(this).trigger(eventName, data)
    return this
  }
}
// Cart constructor
// =========================
var Cart = function () {
  this.reset(true)
}

Cart.prototype = {
  
  // Load server cart data
  // -----------------------
  // 
  //  Takes:
  //
  // - `fn`: a callback to be run once the server has responded successfully
  //
  // Triggers:
  //
  // - `loading`: before server response
  // - `loaded`: after successfully loaded from server. Updated cart object passed as argument.
  // - `error`: something went wrong with the Ajax request
  
  load: function (fn) {
    this.trigger('loading')
    fn = fn || $.noop
    this.request('/cart.json', {type: 'get'}, function (cartData) {
      this.update(cartData)
      fn(this)
      this.trigger('loaded', [this])
    })
    return this
  },
  
  // Reset client-side cart
  // -----------------------
  // 
  // Resets product list and totals. Called on instantiation and useful for testing.
  
  reset: function (silent) {
    this.products = []
    this.units = 0
    this.formatted_total = '0'
    this.currency = null
    this.total = 0
    this._loaded = false
    if(silent) this.trigger('reset')
    return this
  },
  
  // Add a product to the cart
  // ---------------------------
  //
  // Increments quantity if product already in the cart
  //
  // Takes:
  //
  // - `productId`: product ID to ad to cart
  // - `fn`: (optional) a callback to be run with the loaded cart as an argument.
  // - `opts`: (optional) options object with default overrides.
  //
  // Options are:
  //
  // - `url`: URL to load cart from (default: /cart/cart_items)
  // - `type`: request method (default: 'get')
  // - `quantity`: units of this product to add to cart
  //
  // Triggers:
  //
  // - `adding`: before server response
  // - `added`: after successfully added to server. Added product passed as argument.
  // - `error`: something went wrong with the Ajax request
   
  add: function (productId, fn, opts) {
    fn = fn || $.noop;
    
    var opts = $.extend({
      url: '/cart/cart_items',
      quantity: 1,
      type: 'post',
      dataType: 'json'
    }, opts || {})
    
    opts.data = {
      cart_item: {
        product_id: productId,
        quantity: opts.quantity
      }
    }
    
    this.trigger('adding', [{product_id: productId}]);
    
    this.request(opts.url, opts, function (cartData) {
      this.update(cartData)
       var item = this.find(productId)
       fn(item)
       this.trigger('added', [item])
    })

    return this
  },
  
  // Find a product by product ID
  // ------------------------------
  
  find: function (productId, fn) {
    var match = null;
    this.forEach(function (item) {
      if(item.product_id == productId){
        match = item
      }
    })
    if(fn) fn(match)
    return match
  },
  
  // Loop all products. Emulate JavaScript's forEach
  // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
  forEach: function (fn, context) {
    context = context || this
    var i;
    return this.loadAndThen(function () {
      for(i = 0; i < this.products.length; i++) {
        fn.call(context, this.products[i], i, this.products)
      }
    })
  },
  
  // Remove a product by product id
  // ------------------------------
  //
  // Takes:
  //
  // - `productId`: product ID to remove from cart
  // - `fn`: (optional) callback to be run after successful removal. Removed product passed as argument.
  // - `opts`: (optional) options object
  //
  // Options are:
  //
  // - `url`: URL to DELETE (default: /cart/cart_items/:cart_item_id)
  // - `type`: request method (default: 'delete')
  //
  // Triggers:
  //
  // - `removing`: before server response
  // - `removed`: after successfully removed
  // - `error`: something went wrong with the Ajax request
  
  remove: function (productId, fn, opts) {
    fn = fn || $.noop
    
    return this.loadAndThen(function () {
      var item = this.find(productId)
      if(!item){this.trigger('error', ["No cart item with product ID " + productId]); return this}
      this.trigger('removing', [item])
      var opts = $.extend({
        url: ('/cart/cart_items/' + item.id),
        type: 'delete'
      }, opts);
      
      this.request(opts.url, opts, function (cartData) {
        this.update(cartData)
        fn(item)
        this.trigger('removed', [item])
      })
      
    })
  },
  
  // Wrap other function calls in this to make sure the cart is loaded
  
  loadAndThen: function (fn) {
    if(this._loaded) {
      fn.call(this)
    } else {
      this.load($.proxy(fn, this))
    }
    return this
  },
  
  // Is the cart empty?
  // -------------------
  isEmpty: function () {
    return !this.products || this.products.length < 1
  },
  
  // Update cart with server response
  
  update: function (cartData) {
    this._loaded = true
    $.extend(this, cartData)
    this.trigger('updated')
  },
  
  // Issue an Ajax request
  // -----------------------
  //
  // Takes: 
  //
  // - `url`
  // - `opts`: Ajax options object as per jQuery.ajax
  // - `fn`: success callback. Will be run in the context of this instance.
  //
  request: function (url, opts, fn) {
    opts = $.extend({
      success: $.proxy(fn, this),
      error: $.proxy(function (e) {
        this.trigger('error', [e])
      }, this)
    }, opts || {})
    return $.ajax(url, opts)
  }
}

// Mix in bind and trigger of events
$.extend(Cart.prototype, Events);

// Assign new instance to global Bootic.Cart
Bootic.Cart = new Cart();
// HTML data API (jQuery plugin)
// ==============================

$(function () {
  
  function get(productId) {
    return $('[data-bootic-productId="'+ productId +'"]')
  }
  
  Bootic.Cart
    .bind('adding', function (evt, item) {
      get(item.product_id).trigger('adding.bootic', [item])
    })
    .bind('added', function (evt, item) {
      get(item.product_id).trigger('added.bootic', [item])
    })
    .bind('removing', function (evt, item) {
      get(item.product_id).trigger('removing.bootic', [item])
    })
    .bind('removed', function (evt, item) {
      get(item.product_id).trigger('removed.bootic', [item])
    })
    .bind('loaded', function (evt, cart) {
      cart.forEach(function (item) {
        get(item.product_id).trigger('added.bootic', [item])
      })
    })
  
  
  $('form[data-bootic-cart-add]')
    .on('added.bootic', function (evt, item) {
      $(this).addClass('bootic_cart_added')
    })
    .on('removed.bootic', function (evt, item) {
      $(this).removeClass('bootic_cart_added')
    })
    .on('submit', function () {
    
      var $e = $(this),
          productId = $e.find('input[name="cart_item[product_id]"]').val(),
          variantInput = $e.find('input[name="cart_item[variant_id]"]'),
          qtyIput = $e.find('input[name="cart_item[quantity]"]');
      
      var options = {
        type: $e.attr('method'),
        url: $e.attr('action'),
        quantity: 1
      }
      
      if(variantInput.length > 0) options['variant_id'] = variantInput.val()
      
      Bootic.Cart.find(productId, function (product) {
        if(qtyIput.length > 0) { // user is providing quantity
          options.quantity = qtyIput.val()
        } else if(product) { // increment by 1
          options.quantity = product.quantity + 1
        }
        Bootic.Cart.add(productId, null, options)
      })
      
      return false
          
    })
  
  Bootic.templateEngine = tim.parser({start:"<%", end:"%>", type:"text/html"})
  Bootic.templates = Bootic.templates || {}; // template cache object
  
  $("script[type='text/html'][data-template]").each(function(){
    var $e = $(this)
    Bootic.templates[$e.data('template')] = $e.html();
  });
  
  $.fn.booticTemplateRender = function (templateName, data) {
    var content = Bootic.templateEngine(Bootic.templates[templateName], data);
    $(this).empty().append(content)
    return $(this)
  }
  
})
})(window, jQuery);
/*!
 * Tim
 *   github.com/premasagar/tim
 *
 */
/*
    A tiny, secure JavaScript micro-templating script.
*/
/*

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        tim

    **

    v0.3.0

*/
/*global window */
/*
    TODO:
    * a way to prevent a delimiter (e.g. ", ") appearing last in a loop template
    * Sorted constructor for auto-sorting arrays - used for parsers -> two parsers are added, one for identifying and parsing single-tokens and one for open/close tokens - the parsers then create two new Sorted instance, one for single-token plugins and one for open/close token plugins
*/
var tim = (function createTim(initSettings) {
  "use strict";
  var settings = {
    start: "{{",
    end: "}}",
    path: "[a-z0-9_][\\.a-z0-9_]*" // e.g. config.person.name
  },
    templates = {},
    filters = {},
    stopThisFilter, pattern, initialized, undef;
  /////
  // Update cached regex pattern

  function patternCache() {
    pattern = new RegExp(settings.start + "\\s*(" + settings.path + ")\\s*" + settings.end, "gi");
  }
  // settingsCache: Get and set settings
/*
        Example usage:
        settingsCache(); // get settings object
        settingsCache({start:"<%", end:"%>", attr:"id"}); // set new settings
    */

  function settingsCache(newSettings) {
    var s;
    if (newSettings) {
      for (s in newSettings) {
        if (newSettings.hasOwnProperty(s)) {
          settings[s] = newSettings[s];
        }
      }
      patternCache();
    }
    return settings;
  }
  // Apply custom settings
  if (initSettings) {
    settingsCache(initSettings);
  } else {
    patternCache();
  }
  /////
  // templatesCache: Get and set the templates cache object
/*
        Example usage:
        templatesCache("foo"); // get template named "foo"
        templatesCache("foo", "bar"); // set template named "foo" to "bar"
        templatesCache("foo", false); // delete template named "foo"
        templatesCache({foo:"bar", blah:false}); // set multiple templates
        templatesCache(false); // delete all templates
    */

  function templatesCache(key, value) {
    var t;
    switch (typeof key) {
    case "string":
      if (value === undef) {
        return templates[key] || "";
      } else if (value === false) {
        delete templates[key];
      } else {
        templates[key] = value;
      }
      break;
    case "object":
      for (t in key) {
        if (key.hasOwnProperty(t)) {
          templatesCache(t, key[t]);
        }
      }
      break;
    case "boolean":
      if (!key) {
        templates = {};
      }
      break;
    }
    return templates;
  }

  function extend(obj1, obj2) {
    var key;
    for (key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }
  /////
  // FILTERS    

  function sortByPriority(a, b) {
    return a[1] - b[1];
  }
  // Add filter to the stack

  function addFilter(filterName, fn, priority) {
    var fns = filters[filterName];
    if (!fns) {
      fns = filters[filterName] = [];
    }
    fns.push([fn, priority || 0]);
    fns.sort(sortByPriority);
    return fn;
  }

  function applyFilter(filterName, payload) {
    var fns = filters[filterName],
      args, i, len, substituted;
    if (fns) {
      args = [payload];
      i = 2;
      len = arguments.length;
      for (; i < len; i++) {
        args.push(arguments[i]);
      }
      i = 0;
      len = fns.length;
      for (; i < len; i++) {
        args[0] = payload;
        substituted = fns[i][0].apply(null, args);
        if (payload !== undef && substituted !== undef) {
          payload = substituted;
        }
        if (stopThisFilter) {
          stopThisFilter = false;
          break;
        }
      }
    }
    return payload;
  }
  // Router for adding and applying filters, for Tim API

  function filter(filterName, payload) {
    return (typeof payload === "function" ? addFilter : applyFilter).apply(null, arguments);
  }
  filter.stop = function () {
    stopThisFilter = true;
  };
  /////
  // Merge data into template
/*  
        // simpler alternative, without support for iteration:
        template = template.replace(pattern, function(tag, token){
            return applyFilter("token", token, data, template);
        });
    */
  // TODO: all an array to be passed to tim(), so that the template is called for each element in it

  function substitute(template, data) {
    var match, tag, token, substituted, startPos, endPos, templateStart, templateEnd, subTemplate, closeToken, closePos, key, loopData, loop;
    while ((match = pattern.exec(template)) !== null) {
      token = match[1];
      substituted = applyFilter("token", token, data, template);
      startPos = match.index;
      endPos = pattern.lastIndex;
      templateStart = template.slice(0, startPos);
      templateEnd = template.slice(endPos);
      // If the final value is a function call it and use the returned
      // value in its place.
      if (typeof substituted === "function") {
        substituted = substituted.call(data);
      }
      if (typeof substituted !== "boolean" && typeof substituted !== "object") {
        template = templateStart + substituted + templateEnd;
      } else {
        subTemplate = "";
        closeToken = settings.start + "/" + token + settings.end;
        closePos = templateEnd.indexOf(closeToken);
        if (closePos >= 0) {
          templateEnd = templateEnd.slice(0, closePos);
          if (typeof substituted === "boolean") {
            subTemplate = substituted ? templateEnd : '';
          } else {
            for (key in substituted) {
              if (substituted.hasOwnProperty(key)) {
                pattern.lastIndex = 0;
                // Allow {{_key}} and {{_content}} in templates
                loopData = extend({
                  _key: key,
                  _content: substituted[key]
                }, substituted[key]);
                loopData = applyFilter("loopData", loopData, loop, token);
                loop = tim(templateEnd, loopData);
                subTemplate += applyFilter("loop", loop, token, loopData);
              }
            }
            subTemplate = applyFilter("loopEnd", subTemplate, token, loopData);
          }
          template = templateStart + subTemplate + template.slice(endPos + templateEnd.length + closeToken.length);
        } else {
          throw "tim: '" + token + "' not closed";
        }
      }
      pattern.lastIndex = 0;
    }
    return template;
  }
  // TIM - MAIN FUNCTION

  function tim(template, data) {
    var templateLookup;
    // On first run, call init plugins
    if (!initialized) {
      initialized = 1;
      applyFilter("init");
    }
    template = applyFilter("templateBefore", template);
    // No template tags found in template
    if (template.indexOf(settings.start) < 0) {
      // Is this a key for a cached template?
      templateLookup = templatesCache(template);
      if (templateLookup) {
        template = templateLookup;
      }
    }
    template = applyFilter("template", template);
    // Substitute tokens in template
    if (template && data !== undef) {
      template = substitute(template, data);
    }
    template = applyFilter("templateAfter", template);
    return template;
  }
  // Get and set settings, e.g. tim({attr:"id"});
  tim.settings = settingsCache;
  // Get and set cached templates
  tim.templates = templatesCache;
  // Create new Tim function, based on supplied settings, if any
  tim.parser = createTim;
  // Add new filters and trigger existing ones. Use tim.filter.stop() during processing, if required.
  tim.filter = filter;
  /////
  // dotSyntax default plugin: uses dot syntax to parse a data object for substitutions
  addFilter("token", function (token, data, tag) {
    var path = token.split("."),
      len = path.length,
      dataLookup = data,
      i = 0;
    for (; i < len; i++) {
      dataLookup = dataLookup[path[i]];
      // Property not found
      if (dataLookup === undef) {
        throw "tim: '" + path[i] + "' not found" + (i ? " in " + tag : "");
      }
      // Return the required value
      if (i === len - 1) {
        return dataLookup;
      }
    }
  });
  return tim;
}()); /*jslint browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
