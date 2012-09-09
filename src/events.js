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