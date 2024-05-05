const typeOf = (t) =>
  ["object", "function"].includes(typeof t)
    ? Object.prototype.toString.call(t).slice(8, -1)
    : typeof t;

const encodeDecode = (n, o, encode = true) =>
  encode ? n.charAt(o.indexOf(encode ? encode : decode)) : o.charAt(n.indexOf(decode));

const A = (data, rule, encode = true) => {
  const validTypes = ["string", "array", "object", "function"];
  if (!validTypes.includes(typeOf(data))) {
    throw new Error("Invalid data type. Expected string, array, object, or function.");
  }

  const encodingTable = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = [];

  if (typeOf(data) === "string") {
    for (let i = 0; i < data.length; i++) {
      const char = data.charAt(i);
      result.push(encodeDecode(encodingTable, encodingTable, encode)(char));
    }
  } else if (typeOf(data) === "array" || typeOf(data) === "object") {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        result.push(A(value, rule, encode));
      }
    }
  } else if (typeOf(data) === "function") {
    for (let i = 0; i < data.length; i++) {
      const value = data(i);
      result.push(A(value, rule, encode));
    }
  }

  return typeOf(result) === "object" ? JSON.stringify(result) : result.join("");
};

const customMap = (data, rule, encode = true) => A(data, rule, encode);
