var BooticCart = (function () {

  function BooticCart (name) {
    this.name = name;
  }
  
  BooticCart.prototype = {
    title: function () {
      return 'Mr. ' + this.name;
    }
  }
  
  return BooticCart;
})();