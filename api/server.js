const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const UserModel = require('./routes/users/userModel');
const userRouter = require('./routes/users/userRoutes');
const notesRouter = require('./routes/notes/notesRoutes');

const app = express();
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', express.static(path.join(__dirname, '../build')));

app.use('/api/users', userRouter);
app.use('/api/notes', notesRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

const PORT = 4000;

mongoose
  .connect('mongodb://localhost:27017/note-app',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(async () => {

    await UserModel.deleteMany();

    const userDocument = new UserModel({
      "email":"mike@mikecorp.ca",
      "password":"password123",
      "firstName":"Mike",
      "lastName":"Perrotte",
    });
    await userDocument.save();

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log('wat:', err));
