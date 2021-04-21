const express = require('express');

const { createUser, findUserById } = require('./userController');
const { verifyToken } = require('../../middleware/verifyToken');
const { createToken } = require('../../tokens/tokenService');

const router = express.Router();

router.route('/signup')
  .post(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || email === '') {
      return res.status(400).json({ message: 'email must be provided' });
    }

    if (!password || password === '') {
      return res.status(400).json({ message: 'password must be provided' });
    }

    if (!firstName || firstName === '') {
      return res.status(400).json({ message: 'firstName must be provided' });
    }

    if (!lastName || lastName === '') {
      return res.status(400).json({ message: 'lastName must be provided' });
    }

    try {
      const user = await createUser({ email, password, firstName, lastName });
      // NOTE: the 'payload' of the token is the parameter
      const token = createToken({ id: user._id });

      res.status(201).json({ access_token: token });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'internal server error' });
    }
  });

router.route('/login')
  .post(async (req, res) => {
    const { email, password } = req.body;

    if (!email || email === '') {
      return res.status(400).json({ message: 'email must be provided' });
    }

    if (!password || password === '') {
      return res.status(400).json({ message: 'password must be provided' });
    }

    try {
      const user = await loginUser({ email, password });
      const token = createToken({ id: user._id });

      res.json({ access_token: token });
    } catch (err) {
      console.error(err);
      if (err.message && err.message === 'unauthorized') {
        return res.status(403).json({ message: 'unauthorized' });
      }
      return res.status(500).json({ message: 'internal server error' });
    }
  });

router.route('/userinfo')
  .get(verifyToken, async (req, res) => {
    try {
      const { id } = req.user;
      const user = await findUserById(id);
      res.json(user);
    } catch (err) {
      if (err.message && err.message === 'not found') {
        return res.status(404).json({ message: 'user not found' });
      }
      return res.status(500).json({ message: 'internal server error' });
    }
  });


module.exports = router;
