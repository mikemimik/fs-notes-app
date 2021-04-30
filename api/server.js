const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const UserModel = require('./routes/users/userModel');
const NoteModel = require('./routes/notes/notesModel');

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

const PORT = process.env.PORT || 4000;
const DB_URL = process.env.DB_URL || 'mongodb://localhost:27017/note-app';

mongoose
  .connect(DB_URL,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(async () => {

    await UserModel.deleteMany();
    await NoteModel.deleteMany();

    const userDocument = new UserModel({
      "email":"mike@mikecorp.ca",
      "password":"password123",
      "firstName":"Mike",
      "lastName":"Perrotte",
    });
    await userDocument.save();
    const userDocument2 = new UserModel({
      email: "rylie@mikecorp.ca",
      password: "password123",
      firstName: "Rylie",
      lastName: "Smith",
    });
    await userDocument2.save();

    const noteDoc1 = new NoteModel({
      userId: userDocument._id,
      text: 'remember to pickup the ketchup',
    });
    await noteDoc1.save();

    const noteDoc2 = new NoteModel({
      userId: userDocument._id,
      text: 'remember to pickup the ketchup',
    });
    await noteDoc2.save();

    const noteDoc3 = new NoteModel({
      userId: userDocument._id,
      text: 'remember to pickup the ketchup',
    });
    await noteDoc3.save();

    const noteDoc4 = new NoteModel({
      userId: userDocument2._id,
      text: 'remember to pickup the ketchup',
    });
    await noteDoc4.save();

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log('wat:', err));
