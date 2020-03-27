# Token authentication code along: starter files
To run this project, do the following:
1. Run `mongod` to start an instance of mongo db on your computer
2. Run `yarn start` or `npm start` to run the front end
3. In another terminal window, run `node server.js` or `nodemon server.js`

## Backend Code
This codebase already includes the code needed to create notes. However, we want to associate those notes with specific users and only allow the user that created the note to view it. 

In order to do that, we are going to have to implement a few things:
- A User model that is associated with the notes model
- Routes to create and login users
- Token authentication middleware

Let's start by creating the User model and associating it with the already created Note model. To do this, open the `userModel.js` file and add the following code:

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

Next up, we are going to add some logic to our User model to deal with passwords! Right now our User model is just saving the password as plain text, this is not secure at all! We will be using a library called `bcrypt` to hash our passwords.

In order to secure our passwords, we need two things:
1. A pre-save hook that will hash the password before saving the user record into the database
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
Okay, great! Let's add some functionality that will help us create create users. In the `userController.js` file, add the following code to save a user in the database:

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
When we call the mongoose `save()` method, the `pre save` function we wrote will get automatically called and will hash our passwords for us.

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

This route will require an `email` and `password`. We will then get a user from the database with the corresponding email. If a user does not exist with that email, we will send the client back an error. If a user doest exist with that email, we will take the provided password and the password from the database and compare them! If they match, we will generate a JWT token and send it back to the user in a cookie.

Let's first create the logic that handles creating a JWT token if we successfully login the user. We will create a function that takes a user object, converts it to JSON, base64 encodes it and then signs it all in one small line of code. The `sign` method from the `jsonwebtoken` is very powerful. It is doing all of that for us, all we have to do is provide a regular Javascript object. Whatever gets provided to this `sign` method is information that we will later be able to decode and use to understand what user is making a request.

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
      // save token in the cookie
      res.cookies('token', token);
      // send an empty response back
      res.status(200).send({});
    } catch (ex) {
      console.log(ex);
      res.status(500).json({ message: 'internal server error' });
    }
  });
```

In the above code, we have created a token and then saved this token into a *cookie*. Cookies represent small pieces of data that we can add to user’s web browsers, either through Front End means or from Back End servers. Cookies are key-value stores, so can only store small amounts of data. They are kept in the browser and attached to requests made to the server. This means our client does not have to do any work to store or update this token because the browser will take care of storing the cookie it receives for the client.

## Get user
Great, we now have the ability for our users to be created and logged in. Finally, we need to create a route that will allow the client to get information about the user that is logged in. The client will provide a token via the cookie. The server will take that token and generate a signature based on the information in the provided token. If that signature matches the signature on the provided token, it will use the user ID saved in the token to retrieve information on the corresponding user.

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
Again, we have a relatively small amount of code doing a lot of work here, the `verify` method from the `jswonwebtoken` library is doing all the heavy lifting for us.


We also need a function that looks up a user in the database based on the ID that is provided in the token. In the `userController.js` file, add the following function that takes an ID and looks it up in the database:
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

Now, we will use these functions in the get user route.
```javaScript
// userRoutes.js
const { createUser, findUserByEmail, findUserByID } = require('./userController');
const { createToken, verifyToken } = require('../../tokens/tokenService');
//...
  router
    .route('/me')
    .get(async (req, res) => {

        const { cookies } = req;
        try {
            if(!cookies || !cookies.token) {
                res.status(403).json({ message: 'authorization required '});
                return;
            }
          const token = cookies.token;
          const userToken = await verifyToken(token);
          const user = await findUserByID(userToken.id);

          res.json({ data: user });
      } catch(err) {
        console.log(err);
        res.status(500).json({ message: 'internal server error' });
      }
  });
```

Great! We now have the ability to create a user, log them in and provide information about them back to the front end. 

Some of the code included in this route that pertains to getting token information from the cookie is logic that we are going to reuse across many routes. Therefore, we are going to move it into a middleware function that we can implement on other routes!

Remove the following code from the route we just created:
```javaScript
// userRoutes.js
// Copy and remove the following code from the /me route:
        const { cookies } = req;
        try {
            if(!cookies || !cookies.token) {
                res.status(403).json({ message: 'authorization required '});
                return;
            }
        const token = cookies.token;
        const userToken = await verifyToken(token);
```
Ensure you replace the `try` block in the `/me` route as well as remove the reference to `userToken` which should be replaced by `req.user.id`, we will find out why in a second! This route should now look like this:
```javaScript
// userRoutes.js
  router
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
```

## Create user middleware
We will now create middleware which will first access the token stored in the cookie and check to ensure it is a valid token. It will then attach the decoded information from the token onto the request object so that all subsequent functions that deal with that request object can access it. In this way we can use this middleware to ensure that a user is logged in because without calling the `/login` route, a client will not have a valid token in their cookie with which to make requests.

```javaScript
// middleware/verifyToken.js
const { verifyToken } = require('../tokens/tokenService');

exports.verifyToken = async (req, res, next) => {
  const { cookies } = req;
  try {
    if(!cookies || !cookies.token) {
      res.status(403).json({ message: 'authorization required '});
      return;
    }
    const token = cookies.token;

    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch(err) {
    console.log(err, 'error?');
    res.status(403).json({ message: 'invalid or expired token' });
  }
};

```

Now we need to use the middleware on the routes we want to ensure a user is logged in to access.

```javaScript
//userRoutes.js
const { verifyToken } = require('../../middleware/verifyToken');
//...
  router
    .use(verifyToken)
    .route('/me')
```

We are accessing the value attached to the request object when we call `findUserByID` in this route.

## Edit note routes
Now we can use the user middleware in the notes routes in order to save notes for a specific user. We will add the middleware in a way that means that all routes created on the notes router will have access to the `req.user` properties as long as the client passes a cookie containing a valid token!

```javaScript
//notesRoutes.js
const { verifyToken } = require('../../middleware/verifyToken');
//...

const router = express.Router();
// middleware
router.use(verifyToken);
router.route('/')
```

Let's use the new `req.user` object in a couple of the routes.

In the `get` request:
```javaScript
// notesRoutes.js
  .get(async (req, res) => {
    const { user } = req;
    try {
      const notes = await getNotesByUser(user.id);
      res.json({ data: notes });
    //....
```

In the `post` request:
```javaScript
//notesRoutes.js
  .post(async (req, res) => {
    try {
      const { body } = req;
      if (!body.text || body.text === '') {
        res.status(400).json({ message: 'text must be provided' });
      }
      const newNote = {
        user: req.user.id,
        text: body.text,
      }
      //.....
```

In the `put` request:
```javaScript
  .put(async (req, res) => {
    try {
      const { body, params, user } = req;
      if (!body.text || body.text === '') {
        res.status(400).json({ message: 'text must be provided' });
      }

      const newNote = await updateNoteById({
        text: body.text,
        id: params.id,
        user: user.id,
      });
      //....
```

Great, now we should have our backend routes working with authenticated users and information being passed back to the client using cookies!

## Update the front end code
We can now create some front end logic to login in our users. We will first create a function that checks with the server to see if a user is already logged in. If no cookie exists in the browser for our app, this request will fail. If a cookie already exists, we will get information back about that user and store it in state.

```javaScript
// App.js
  async function getUser() {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      updateUser(data.data);
    } catch (err) {
      console.log("error?");
      updateUser(undefined);
      console.log({ err });
    }
  }
  useEffect(() => {
    getUser();
  }, []);
```

There is logic that already exists in the `return` function of our app that handles routing for us. If a user exists, that user will be navigated to the `'/'` route of our front end and therefore allowed to view their notes. Otherwise, the user is shown the login page.

Create a `handleSubmit` function in the `Login` component. This will hit the login route we created with an email and password. If the email and password match a record in the database, the server will respond with a cookie. We do not have to write any code that expressly handles that cookie as modern browsers will store it for us and include it in most requests. 

```javaScript
//Login.js
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      props.getUser();
    } catch (err) {
      updateError(err.message);
    }
  };
```

Finally, we will add similar logic to a `handleSubmit` function in the `SignUp` component:

```javaScript
//SignUp.js
  async function signUpUser() {
    try {
      const body = {
        email,
        password,
        firstName,
        lastName,
      };
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!loginResponse.ok) {
        throw new Error(data.message);
      }

      props.getUser();
    } catch (err) {
      console.log('error?');
      props.updateUser(undefined);
      console.log({ err });
    }
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    signUpUser();
  }
```

That's it! No other changes to the front end are needed. Again, this is made very simple for us because of how the browser handles attaching cookies to `fetch` requests automatically for us if it finds a cookie for our site stored in the browser. 

Phew! We've now created an authentication pattern on our server and front end.