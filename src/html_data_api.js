// HTML data API (jQuery plugin)
// ==============================

$(function () {
  
  var formSelector = 'form[data-bootic-cart-add]';
  
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
    .bind('updated', function () { // Site wide Bootic promotion notice
      var top = $('#bootic_top_notice')
      if(top.length == 0) {
        $('body').prepend('<div id="bootic_top_notice"></div>')
      }
      if(Bootic.Cart.hasPromotion) {
        var h = $('#bootic_top_notice').booticTemplateRender('bootic_top_promo', Bootic.Cart).height()
        $('body').css('paddingTop', (parseInt(h) + 5) + 'px')
        if(Bootic.Cart.invalidPromotion) $('#bootic_top_notice #bootic_top_promo').addClass('bootic_warning')
        else $('#bootic_top_notice #bootic_top_promo').removeClass('bootic_warning')
      }
    })
  
  
  // Lets remove quantity field from form. Simpler to click many times or use Ajax cart
  $('input[name="cart_item[quantity]"]').remove()
  
  // If $e is a set of radio buttons get checked one
  function getUniqueValue ($e) {
    if($e.is(':radio')) 
      return $e.filter(':checked').val()
    else
      return $e.val()
  }
  
  $(formSelector)
    .on('added.bootic', function (evt, item) {
      $(this).addClass('bootic_cart_added')
    })
    .on('removed.bootic', function (evt, item) {
      $(this).removeClass('bootic_cart_added')
    })
    .on('submit', function (evt) {
      var $e = $(this),
          variantId = getUniqueValue($e.find('input[name="cart_item[variant_id]"]')),
          qtyIput = $e.find('input[name="cart_item[quantity]"]');
      
      if(variantId == undefined) {
        evt.preventDefault()
        throw "Your form must have an input of name cart_item[variant_id]"
      }
      
      var options = {
        type: $e.attr('method'),
        url: $e.attr('action'),
        quantity: 1
      }
      
      // We need to trigger the product ID here, because we don't get it from the API until added.
      $e.trigger('adding.bootic', {product_id: $e.data('bootic-cart-add')})
      
      Bootic.Cart.find(variantId, function (item) {
        if(qtyIput.length > 0) { // user is providing quantity
          options.quantity = qtyIput.val()
        } else if(item) { // increment by 1
          options.quantity = item.quantity + 1
        }
        Bootic.Cart.add(variantId, null, options)
      })
      
      return false
          
    })
  
  Bootic.templateEngine = tim.parser({start:"@{", end:'}', type:"text/html"})
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