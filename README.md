# Token authentication code along: starter files
To run this project, do the following:
1. Run `mongod` to start an instance of mongo db on your computer
2. Run `yarn start` or `npm start` to run the front end
3. In another terminal window, run `node server.js`

<!-- Potential steps: -->
<!-- Create user models -->
<!-- Encoporate user models into notes models -->
<!-- Encorporate user into notes controllers & routes -->
<!-- create token middleware (and service) -->

<!-- end back end part! -->

<!-- start front end part -->
<!-- Create global user state in the App.js component -->
<!-- Add to note creation -->
<!-- This will control what we show in our front end code -->
<!-- In Login component, add handleSubmit code. Use a user that already exists (this will include storing tokens in local storage.)-->
<!-- Add routing to re route to show notes -->
<!-- In SignUp component, add handleSubmit code -->
<!-- Add routing -->

## Backend Code
This codebase already includes the code needed to create notes. However, we want to associate those notes with specific users and only allow the user that created the note to view it. 

In order to do that, we are going to have to implement a few things:
- A User model that is associated with the notes model
- Routes to create and login users
- Token authentication middleware

Let's start by creating the User model and associating it with the already create Note model. To do this, open the `userModel.js` file and add the following code:

```javaScript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('User', userSchema);
```

Now, we are going to associate this User model with the Note model since we only want our app to display notes that belong to the user who created them. In the `notesModel.js` file, add the following:

```javaScript
// notesModel.js
const notesSchema = new Schema({
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    //...
```

We are using association (instead of nesting) here because a User is it's own entity and can be linked to many different notes. 

Next up, we are going to add some logic to our User model to deal with passwords! Right now our User model is just saving the password as plain text, this is not secure at all! We will be using a library called `bcrypt`  to hash our passwords.

In order to secure our passwords, we need two things:
1. A 'pre' save hook that will hash the password before saving the user record into the database
2. A compare password method that can decrypt a provided password and check it against the password saved in the database.

In the `userModel.js` file, add the following code:

```javaScript
//userModel.js
const bcrpyt = require('bcryptjs');
//...after the userSchema declaration:
// Pre save function that hashes password:
userSchema.pre('save', async function(next) {
  const user = this;

  try {
    if (user.isModified('password') || user.isNew) {
      const encrpytedPassword = await bcrpyt.hash(user.password, 10);
      user.password = encrpytedPassword;
    }

    next();
  } catch(ex) {
    next(ex);
  }
});

// Compare password method used to check if a password matches the one saved in the database
userSchema.methods.comparePasswords = function(password) {
  const user = this;
  return bcrpyt.compare(password, user.password);
}
```

## Create users
Okay, great! Let's create some functionality that will help us create create users:

In the `userController.js` file, add the following code to save a user in the database:

```javaScript
// userController.js
exports.createUser = async ({ email, password, firstName, lastName }) => {
  try {
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
    });
    const user = await newUser.save();
    return user;
  } catch (ex) {
    throw ex;
  }
};

```

We are also going to create a function to check if the email already exists before saving it in the database. Add the following code to the same file:

```javaScript
// userController.js
exports.findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (ex) {
    throw ex;
  }
}
```
Let's use these two functions in the route file to create a post route that will allow us to create users. This route has lots of null checks to ensure that the user is providing all of the correct information.

```javaScript
// userRoutes.js
const { createUser, findUserByEmail } = require('./userController');
// ...
router.route('/')
// post route to create users
  .post(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || email === "") {
      res.status(400).json({ message: 'email must be provided' });
      return;
    }

    if (!password || password === "") {
      res.status(400).json({ message: 'password must be provided' });
      return;
    }

    if (!firstName || firstName === "") {
      res.status(400).json({ message: 'firstName must be provided' });
      return
    }

    if (!lastName || lastName === "") {
      res.status(400).json({ message: 'lastName must be provided' });
      return
    }


    try {
      const foundUser = await findUserByEmail(email);
      if (foundUser) {
        res.status(400).json({ message: `email '${email}' already exists'` });
        return;
      }

      const user = await createUser({ email, password, firstName, lastName });
      res.json({ data: { id: user._id } });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'internal server error' });
    }
  });
```

Great, we are now able to send a post request with the appropriate fields and save a user with an encrypted password in our database.

## Login route
Next up, let's create a route to login our users. This is where we will start incorporating code that works with JWT tokens.

This route will require an `email` and `password`. We will then get a user from the database with the corresponding email. If a user exists with that email, we will take the provided password and the password from the database and compare them! If they match, we will generate a JWT token and send it back to the user. This is the piece of data that the client will need to save in order to continue to make requests on behalf of the user.

Let's first create the logic that handles creating a JWT token if we successfully login the user. We will create a function that takes a user object, converts it to JSON, base64 encodes it and then signs it all in one small line of code. The 'sign' method from the 'jsonwebtoken' is very powerful. It is doing all of that for us, all we have to do is provide a regular Javascript object. Whatever gets provided to this 'sign' method is information that we will later be able to decode and use to understand what user is making a request.

```javaScript
// tokenService.js
const jwt = require('jsonwebtoken');
// Feel free to make this your own secret phrase
const KEY = 'secret phrase';

exports.createToken = (user) => {
  const token = jwt.sign(user, KEY);
  return token;
}
```

Now, we can use this function in our login route. We are also going to use the `comparePassword` function that uses the 'bcrypt' library we wrote earlier:
```javaScript
// userRoutes.js
const { createToken } = require('../../tokens/tokenService');
//...
router.route('/login')
  .post(async (req, res) => {
    const { email, password } = req.body;
    if (!email || email === "") {
      res.status(400).json({ message: 'email must be provided' });
      return;
    }

    if (!password || password === "") {
      res.status(400).json({ message: 'password must be provided' });
      return;
    }
    
    try {
      // does the user exist?
      const user = await findUserByEmail(email);
      if (!user) {
        res.status(400).json({ message: 'password and email do not match'});
        return;
      }

      // do the password match?
      const isMatch = await user.comparePasswords(password);
      if (!isMatch) {
        res.status(400).json({ message: 'password and email do not match'});
        return;
      }

      const token = createToken({ id: user._id });

      res.json({ data: { token } });
    } catch (ex) {
      console.log(ex);
      res.status(500).json({ message: 'internal server error' });
    }
  });
```

## Get user
Great, we now have the ability for our users to be created and logged in. Finally, we need to create a route that will allow the client to get information about the user that is logged in. The client will provide a token, the server will take that token, generate a signature based on the information in the token and if that signature matches the signature on the provided token, it will use the user ID saved in the token to retrieve information on the corresponding user.

Let's write a function that will check the provided token's signature for authenticity:
```javaScript
// tokenService.js
exports.verifyToken = async (token) => {
  let user;
  jwt.verify(token, KEY, (err, decoded) => {
    console.log(err);
    if (err)  {
      throw err;
    }

    user = decoded;
  });

  return user;
}
```

We also need a function that looks up a user in the database based on the ID that is provided in the token.

In the `userController.js` file, add the following function that takes an id and looks it up in the database:
```javaScript
// userController.js
exports.findUserByID = async (id) => {
  try {
    const user = await User.findById(id);
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  } catch (ex) {
    throw ex;
  }
};
```

Now, we will use these functions in the get user route. This route is also going to be 
```javaScript
// userRoutes.js
const { createUser, findUserByEmail, findUserByID } = require('./userController');
const { createToken, verifyToken } = require('../../tokens/tokenService');
//...
  router
    .route('/me')
    .get(async (req, res) => {
        const { headers } = req;
        try {
            if(!headers.authorization) {
                res.status(403).json({ message: 'authorization required '});
                return;
            }
        const token = headers.authorization.split(' ')[1];
        const userToken = await verifyToken(token);
        const user = await findUserByID(userToken.id);
        res.json({ data: user });
      } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'internal server error' });
      }
  });
```

Great! We now have the ability to create a user, log them in and provide information about them back to the front end when needed. 