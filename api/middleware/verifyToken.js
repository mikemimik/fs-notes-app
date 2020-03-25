const { verifyToken } = require('../tokens/tokenService');

exports.verifyToken = async (req, res, next) => {
  const { headers } = req;
  try {
    if(!headers.authorization) {
      res.status(403).json({ message: 'authorization required '});
      return;
    }

    const token = headers.authorization.split(' ')[1];
    const user = await verifyToken(token)
    req.user = user;
    next();
  } catch(err) {
    res.status(403).json({ message: 'invalid or expired token' });
  }
};