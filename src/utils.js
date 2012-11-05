function setCookie (a, b, d) {
  var f, c;
  b = escape(b);
  if (d) {
    f = new Date();
    f.setTime(f.getTime() + (d * 1000));
    c = '; expires=' + f.toGMTString()
  } else {
    c = ''
  }
  document.cookie = a + "=" + b + c + "; path=/"
}

function getCookie (a) {
  var b = a + "=",
      d = document.cookie.split(';');
  for (var f = 0; f < d.length; f++) {
    var c = d[f];
    while (c.charAt(0) == ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(b) == 0) {
      return unescape(c.substring(b.length, c.length))
    }
  }
  return null
}