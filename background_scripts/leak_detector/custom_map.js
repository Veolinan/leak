const typeOf = (t) =>
  ["object", "function"].includes(typeof t)
    ? Object.prototype.toString.call(t).slice(8, -1)
    : typeof t;

const A = (t, r, encode = true) => {
  const n = "kibp8A4EWRMKHa7gvyz1dOPt6UI5xYD3nqhVwZBXfCcFeJmrLN20lS9QGsjTuo";
  const o = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let e, c = [];

  if (typeOf(t) === "String") {
    for (let i = 0, l = t.length; i < l; i++) {
      e = t.charAt(i);
      c.push(encode ? n.charAt(o.indexOf(e)) : o.charAt(n.indexOf(e)));
    }
  } else if (typeOf(t) === "Array" || typeOf(t) === "Object") {
    for (let i in t) {
      if (t.hasOwnProperty(i)) {
        e = t[i];
        c.push(A(e, r, encode));
      }
    }
  } else if (typeOf(t) === "Function") {
    for (let i = 0, l = t.length; i < l; i++) {
      e = t(i);
      c.push(A(e, r, encode));
    }
  }

  return c.join("");
};

const customMap = (t, r, encode = true) => A(t, r, encode);
