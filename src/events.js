var Events = {
  bind: function (eventName, fn) {
    $(this).bind(eventName, fn)
    return this
  },
  
  trigger: function (eventName, data) {
    $(this).trigger(eventName, data)
    return this
  }
}