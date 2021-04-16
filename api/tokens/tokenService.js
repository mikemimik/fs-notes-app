const jwt = require('jsonwebtoken');

const { TOKEN_SECRET_KEY } = require('../config');

exports.createToken = (payload) => {
  const token = jwt.sign(payload, TOKEN_SECRET_KEY);
  return token;
};
