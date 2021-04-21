const User = require('./userModel');

exports.loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('unauthorized');
    }

    const isValid = await user.comparePasswords(password);
    if (!isValid) {
      throw new Error('unauthorized');
    }

    return user;
  } catch (err) {

  }
};

exports.createUser = async ({
  email,
  password,
  firstName,
  lastName,
}) => {
  try {
    const userDocument = new User({
      email,
      password,
      firstName,
      lastName,
    });
    await userDocument.save();

    return userDocument;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

exports.findUserById = async (id) => {
  try {
    const userDocument = await User.findById(id);

    if (!userDocument) {
      throw new Error('not found');
    }

    return userDocument;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
