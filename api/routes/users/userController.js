const User = require('./userModel');

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

