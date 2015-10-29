// HTML data API (jQuery plugin)
// ==============================
// Put all non-instance DOM related behaviours in this namespace
$.Bootic = $.Bootic || {}

// Enable Ajax Buttons.
// Clicking on product "add to cart" buttons will add selected product to Ajax cart. No redirect to /cart
// Usage:
//     $(function () { $.Bootic.ajaxButtons() })
//
$.Bootic.ajaxButtons = function () {

  var formSelector = 'form[data-bootic-cart-add]';

  // Lets remove quantity field from form. Simpler to click many times or use Ajax cart
  $('input[name="cart_item[quantity]"]').remove()

  // If $e is a set of radio buttons get checked one
  function getUniqueValue ($e) {
    if($e.is(':radio'))
      return $e.filter(':checked').val()
    else
      return $e.val()
  }

  // store original value of add-to-cart buttons in a data attribute
  ;(function (e) {
    $(e).data('org-copy', $(e).find('.submit').val())
  })($(formSelector))

  // Add to cart buttons (on product lists and detail)
  // These events are triggered by Bootic.Cart HTML5 API
  $(formSelector)
    .on('adding.bootic', function () {
      $(this).addClass('bootic_cart_adding')
    })
    .on('added.bootic', function (evt, item) {
      $(this).removeClass('bootic_cart_adding')
      $(this).addClass('bootic_cart_added')
      var $button = $(this).find('.submit');
      if(item.more_available)
        $button.val(item.total_units+' '+$button.data('in-cart'))
      else
        $button.val(item.total_units + '. ' + $button.data('out-of-stock'))
    })
    .on('removed.bootic', function (evt, item) {
      $(this).removeClass('bootic_cart_added')
      // Reinstate original button value
      $(this).find('.submit').val($(this).data('org-copy'))
    })
    .on('submit', function (evt) {
      var $e = $(this),
          variantId = getUniqueValue($e.find(':input[name="cart_item[variant_id]"]')),
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
}

// Built-in templating
// Will detect any template in <script data-template type="text/html"></script> tags
// Usage:
//     $.booticTemplateRender('foo_template', data)
//
Bootic.templateEngine = tim.parser({start:"%{", end:'}', type:"text/html"})
Bootic.templates = Bootic.templates || {}; // template cache object

// jQuery plugin to render templates into DOM elements
// Usage:
//    $('.cart').booticTemplateRender('some_template', {name: 'foo'})

$.fn.booticTemplateRender = function (templateName, data) {
  var content = Bootic.templateEngine(Bootic.templates[templateName], data);
  $(this).empty().append(content)
  return $(this)
}

// On page load.
$(function () {

  // Cache all templates found in the page
  $("script[type='text/html'][data-template]").each(function(){
    var $e = $(this)
    Bootic.templates[$e.data('template')] = $e.html();
  });
  Bootic.trigger('templatesLoaded');

  // Listen to cart changes and upate buttons
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

    var prevPadding = $('body').css('paddingTop');

    // Update top promo notice
    Bootic.Cart.bind('updated', function () { // Site wide Bootic promotion notice
      var TOP_NOTICE_SELECTOR = '#bootic_top_notice'

      var top = $(TOP_NOTICE_SELECTOR)

      if(top.length == 0) {
        $('body').prepend('<div id="bootic_top_notice"></div>')
      }
      if(Bootic.Cart.hasPromotion) {
        var h = $(TOP_NOTICE_SELECTOR).booticTemplateRender('bootic_top_promo', Bootic.Cart).height()
        $('body').css('paddingTop', (parseInt(h) + 5) + 'px')
        if(Bootic.Cart.invalidPromotion) $('#bootic_top_notice #bootic_top_promo').addClass('bootic_warning')
        else $('#bootic_top_notice #bootic_top_promo').removeClass('bootic_warning')
        top.show()
      } else {
        top.hide()
        $('body').css('paddingTop', prevPadding);
      }
    })

})
