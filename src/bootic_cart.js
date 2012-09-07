var Cart = function () {
  this.data = {}
}

Cart.prototype = {
  
  load: function (fn) {
    fn = fn || $.noop
    $.getJSON('/cart.json', $.proxy(function (cartData) {
      this.data = cartData;
      this.trigger('loaded', [this])
      fn(cartData)
    }, this))
    return this
  },
  
  add: function (productId, opts) {

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
       success: $.proxy(function (productData) {
         this.trigger('added', [productData]);
       }, this),
       error: $.proxy(function () {
         this.trigger('error')
       }, this)
    })
    return this
  }
}

$.extend(Cart.prototype, Events);

Bootic.Cart = new Cart();