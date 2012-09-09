var Cart = function () {
  this.reset(true)
}

Cart.prototype = {
  
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
  
  add: function (productId, fn, opts) {
    fn = fn || $.noop;
    
    var opts = $.extend({
      url: '/cart/cart_items',
      qty: 1,
      type: 'post',
      dataType: 'json',
    }, opts || {})
    
    var data = {
      cart_item: {
        product_id: productId,
        quantity: opts.qty
      }
    }
    
    this.trigger('adding');
    
    $.ajax(opts.url, {
       dataType: opts.dataType,
       type: opts.type,
       data: data,
       success: $.proxy(function (cartData) {
         this.update(cartData)
         console.log('cartData',cartData)
         var item = this.find(productId)
         fn(item)
         this.trigger('added', [item])
       }, this),
       error: $.proxy(function () {
         this.trigger('error')
       }, this)
    })
    return this
  },
  
  // Sync. Pass a function for async
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
      
      $.ajax(opts.url, {
        type: opts.type,
        success: $.proxy(function (cartData) {
          this.update(cartData)
          fn(item)
          this.trigger('removed', [item])
        }, this)
      })
    })
  },
  
  loadAndThen: function (fn) {
    if(this._loaded) {
      fn.call(this)
    } else {
      this.load($.proxy(fn, this))
    }
    return this
  },
  
  isEmpty: function () {
    return !this.products || this.products.length < 1
  },
  
  update: function (cartData) {
    this._loaded = true
    $.extend(this, cartData)
    this.trigger('updated')
  }
}

$.extend(Cart.prototype, Events);

Bootic.Cart = new Cart();