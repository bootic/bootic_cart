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
  
  load: function (fn) {
    this.trigger('loading')
    fn = fn || $.noop
    $.getJSON('/cart.json', $.proxy(function (cartData) {
      this.update(cartData)
      fn(this)
      this.trigger('loaded', [this])
    }, this))
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
        if(fn) fn(item)
      }
    })
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