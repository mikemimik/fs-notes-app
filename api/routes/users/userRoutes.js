const express = require('express');
const { createUser, findUserByEmail, findUserByID } = require('./userController');
const { createToken } = require('../../tokens/tokenService');
const { verifyToken } = require('../../middleware/verifyToken');

const router = express.Router();

// get user from token route
  router
    .use(verifyToken)
    .route('/me')
    .get(async (req, res) => {
      try {
        const user = await findUserByID(req.user.id);
        res.json({ data: user });
      } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'internal server error' });
      }
  });

module.exports = router;