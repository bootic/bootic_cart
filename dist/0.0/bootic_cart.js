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
  // - `qty`: quantity to increment product units in the cart by (default: 1)
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
      qty: 1,
      type: 'post',
      dataType: 'json'
    }, opts || {})
    
    opts.data = {
      cart_item: {
        product_id: productId,
        quantity: opts.qty
      }
    }
    
    this.trigger('adding');
    
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
    return $('form[data-bootic-productId="'+ productId +'"]')
  }
  
  Bootic.Cart
  
    .bind('added', function (evt, item) {
      get(item.product_id).trigger('added.bootic', [item])
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
        url: $e.attr('action')
      }
      
      if(variantInput.length > 0) options['variant_id'] = variantInput.val()
      if(qtyIput.length > 0) options['quantity'] = qtyIput.val()
      
      $e.trigger('adding.bootic')
      Bootic.Cart.add(productId, function (item) {
        $e.trigger('added.bootic', [item])
      }, options)
      
      return false
          
    })
    
  $.fn.booticTemplateRender = function (data) {
    var $t = $(this);
    for(var propName in data) {
      $t.find('[data-bind="' + propName + '"]').text(data[propName])
    }
    return $t
  }
  
})
})(window, jQuery);
