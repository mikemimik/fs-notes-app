const express = require('express');

const { createUser } = require('./userController');
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
      const token = createToken({ id: user._id });

      res.status(201).json({ access_token: token });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'internal server error' });
    }
  });

router.route('/userinfo')
  .get((req, res) => {
    // TODO: protect this endpoint with middleware
    // TODO: pull user data from request
    // TODO: check if that user exists in the database
    // TODO: return information about user
    res.json({});
  })


module.exports = router;
