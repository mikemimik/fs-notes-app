const express = require('express');
const mongoose = require('mongoose');

const userRouter = require('./api/routes/users/userRoutes');
const notesRouter = require('./api/routes/notes/notesRoutes');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/notes', notesRouter);

mongoose
  .connect('mongodb://localhost:27017/note-app',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    app.listen('8080', () => {
      console.log('server is running on port 8080');
    });
  })
  .catch((err) => console.log(err));