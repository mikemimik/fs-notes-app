const jwt = require('jsonwebtoken');

const { TOKEN_SECRET_KEY } = require('../config');

exports.createToken = (payload) => {
  const token = jwt.sign(payload, TOKEN_SECRET_KEY);
  return token;
};

exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, TOKEN_SECRET_KEY, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      return resolve(decoded);
    });
  });
};
