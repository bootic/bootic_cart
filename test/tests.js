describe("BooticCart", function() {
  var obj;

  beforeEach(function() {
    obj = new BooticCart('John Doe');
  });

  it("should pass test", function() {
    expect(obj.title()).toEqual("Mr. John Doe");
  });

});
