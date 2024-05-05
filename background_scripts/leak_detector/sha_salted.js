const crypto = require('crypto');

function shaSalted1(data) {
  const salt = 'QX4QkKEU';
  const hash = crypto.createHmac('sha256', salt);
  hash.update(data);
  const value = hash.digest('hex');
  return value;
}
