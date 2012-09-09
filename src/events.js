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
  bind: function (eventName, fn) {
    $(this).bind(eventName, fn)
    return this
  },
  
  trigger: function (eventName, data) {
    console.log('trigger', eventName, data)
    $(this).trigger(eventName, data)
    return this
  }
}