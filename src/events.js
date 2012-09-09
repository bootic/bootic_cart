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