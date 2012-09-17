// HTML data API (jQuery plugin)
// ==============================

$(function () {
  
  function get(productId) {
    return $('[data-bootic-productId="'+ productId +'"]')
  }
  
  Bootic.Cart
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