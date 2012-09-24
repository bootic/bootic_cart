describe("Bootic.Cart", function() {
  
  beforeEach(function() {
    this.xhr = sinon.useFakeXMLHttpRequest();
    var requests = this.requests = [];
    
    this.xhr.onCreate = function (xhr) {
        requests.push(xhr);
    };
    
    this.cartResponse = {
      net_total: 100,
      formatted_total: '$100',
      units: 1,
      products: [
        {
          vendor: 'Acme',
          units: 1,
          price: 100,
          formatted_price: '$100',
          model: 'iPod',
          product_id: 123,
          id: 666,
          variant_id: 111,
          image: '/images/foo.png'
        }
      ],
      currency: {
        name: 'USD Dollar',
        symbol: '$',
        subunit_to_unit: 1,
        delimiter: '.'
      }
    }
  });
  
  afterEach(function () {
    this.xhr.restore();
  })
  
  describe('start', function () {
    it('is has no items yet', function () {
      expect(Bootic.Cart.isEmpty()).toBeTruthy()
      expect(Bootic.Cart.products.length).toBe(0)
    })
  })
  
  describe('.load()', function () {
  
    it("makes Ajax request, load cart and call callback", function() {
      var callback = sinon.spy();
      Bootic.Cart.load(callback)
      expect(this.requests.length).toBe(1)
      
      Bootic.Cart
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
      expect(Bootic.Cart.isEmpty()).toBeFalsy()
      expect(Bootic.Cart.products.length).toBe(1)
      expect(callback).toHaveBeenCalledWith(Bootic.Cart)
    });
    
    it('triggers handlers for "loading"', function () {
      var called = 0;
      var handler = function () { called = 1 }
      
      Bootic.Cart.bind('loading', handler)
      Bootic.Cart.load()
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
                                       
      expect(called).toBe(1)
    })
    
    it('triggers handlers for "loaded"', function () {
      var called = 0;
      var handler = function (evt, cart) { called = cart }
      
      Bootic.Cart.bind('loaded', handler)
      Bootic.Cart.load()
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
                                       
      expect(called).toBe(Bootic.Cart)
    })
    
    it('triggers handlers for "updated"', function () {
      var called = 0;
      var handler = function (evt) { called = true }
      
      Bootic.Cart.bind('updated', handler)
      Bootic.Cart.load()
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
                                       
      expect(called).toBeTruthy()
    })
  })
  
  describe('.add()', function () {
    beforeEach(function () {
      Bootic.Cart.reset()
    })
    
    function responseWithProduct(productData) {
      var cartResponse = this.cartResponse
      cartResponse.products.push(productData)
      return cartResponse
    }
    
    it('updates cart and adds product', function () {
      expect(Bootic.Cart.isEmpty()).toBeTruthy()
          
      var callback = sinon.spy();
      
      Bootic.Cart.add(333, callback)
      
      var newProduct = {
            vendor: 'Apple',
            formatted_price: '$100',
            model: 'iPhone',
            product_id: 124,
            variant_id: 333
          },
          cartResponse = responseWithProduct.call(this, newProduct);
      
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(cartResponse));
                                       
      expect(callback).toHaveBeenCalledWith(newProduct)
      expect(Bootic.Cart.isEmpty()).toBeFalsy()
      expect(Bootic.Cart.products.length).toBe(2)
    })
    
    it('triggers handlers for "adding"', function () {
      var called = 0;
      var handler = function () { called = 1 }
      
      Bootic.Cart.bind('adding', handler)
      Bootic.Cart.add(124)
      
      expect(called).toBe(1)
    })
    
    it('triggers handlers for "added"', function () {
      var called = null;
      var handler = function (evt, item) { called = item }
      Bootic.Cart.bind('added', handler)
      
      var newProduct = {
            vendor: 'Apple',
            formatted_price: '$100',
            model: 'iPhone',
            product_id: 124,
            variant_id: 333
          },
          cartResponse = responseWithProduct.call(this, newProduct);
      
      Bootic.Cart.add(333)
      
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(cartResponse));
      
      expect(called.model).toBe('iPhone')
      expect(called.vendor).toBe('Apple')
      
    })
    
    it('triggers handlers for "updated"', function () {
      var called = null;
      var handler = function (evt) { called = true }
      Bootic.Cart.bind('updated', handler)
      
      Bootic.Cart.add(111)
      
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
      
      expect(called).toBeTruthy()
      
    })
  })
  
  describe('.remove()', function () {
    it('removes product', function () {
      var callback = sinon.spy();
      
      Bootic.Cart.update(this.cartResponse)
      
      expect(Bootic.Cart.products.length).toBe(1)
      
      Bootic.Cart.remove(111, callback)
      
      var updatedResponse = $.extend({}, this.cartResponse, {net_total: 0})
      updatedResponse.products = []
      
      this.requests[0].respond(200, { "Content-Type": "application/json" },JSON.stringify(updatedResponse));
      
      expect(Bootic.Cart.products.length).toBe(0)
      expect(Bootic.Cart.net_total).toBe(0)
      
      expect(callback).toHaveBeenCalledWith(this.cartResponse.products[0])
      
    })
    
    it('triggers handlers for "removing"', function () {
       var called = null;
       var handler = function (evt, item) { called = item }
       
       Bootic.Cart.update(this.cartResponse)
       
       Bootic.Cart.bind('removing', handler)
       Bootic.Cart.remove(111)
       
       expect(called.model).toBe('iPod')
    })
    
    it('triggers handlers for "removed"', function () {
       var called = null;
       var handler = function (evt, item) { called = item }
       Bootic.Cart.bind('removed', handler)

       Bootic.Cart.remove(111)

       this.requests[0].respond(200, { "Content-Type": "application/json" },
                                        JSON.stringify(this.cartResponse));

       expect(called.model).toBe('iPod')
       expect(called.vendor).toBe('Acme')
    })
    
    it('triggers handlers for "updated"', function () {
      var called = null;
      var handler = function (evt) { called = true }
      Bootic.Cart.bind('updated', handler)
      
      Bootic.Cart.remove(111)
      
      this.requests[0].respond(200, { "Content-Type": "application/json" },
                                       JSON.stringify(this.cartResponse));
      
      expect(called).toBeTruthy()
      
    })
  })
  
  describe('.find()', function () {
    beforeEach(function () {
      Bootic.Cart.update(this.cartResponse)
    })
    
    describe('sync', function () {
      it('finds items by variant id', function () {
        var item = Bootic.Cart.find(111)
        expect(item.model).toBe('iPod')
      })
    
      it('returns null if item not found', function () {
        var item = Bootic.Cart.find(12333)
        expect(item).toBeNull()
      })      
    })
    
    describe('async', function () {
      it('finds items by variant id', function () {
        var found;
        var item = Bootic.Cart.find(111, function (item) {
          found = item
        })
        expect(found.model).toBe('iPod')
      })
      
      it('returns null if item not found', function () {
        var found = 1;
        var item = Bootic.Cart.find(12333, function (item) {
          found = item
        })
        expect(found).toBeNull()
      })
    })
    
  })

});
