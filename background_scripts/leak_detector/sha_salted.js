const crypto = require('crypto');

function shaSalted(data, salt = generateSalt()) {
  const hash = crypto.createHmac('sha256', salt);
  hash.update(data);
  const value = hash.digest('hex');
  return { value, salt };
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function verifyShaSalted(data, hashedData) {
  const { salt, value: storedValue } = hashedData;
  const hash = crypto.createHmac('sha256', salt);
  hash.update(data);
  const value = hash.digest('hex');
  return value === storedValue;
}

module.exports = { shaSalted, verifyShaSalted };
