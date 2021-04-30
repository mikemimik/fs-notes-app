const Notes = require('./notesModel');

exports.getNotesByUser = async (userID) => {
  try {
    const notes = await Notes
      .find({ userId: userID })
      .populate({ path: 'userId', select: 'firstName lastName' });


    return notes.map((note) => {
      const { createdAt, _id, userId, text } = note;

      const updatedNote = {
        createdAt,
        _id,
        user: {
          firstName: userId.firstName,
          lastName: userId.lastName,
        },
        text,
      };

      return updatedNote;
    });
  } catch (err) {
    throw err;
  }
};

exports.createNote = async (data) => {
  try {
    const newNote = new Notes(data);
    const note = await newNote.save();
    return note.id;
  } catch (err) {
    throw err;
  }
};

exports.getNoteById = async (id) => {
  try {
    const note = await Notes
      .findById(id)
      .populate({ path: 'user', select: 'firstName lastName' });
    return note;
  } catch(err) {
    throw err;
  }
};

exports.updateNoteById = async (note) => {
  try {
    const n = await Notes.findOne({
      user: note.user,
      _id: note.id,
    });
    n.text = note.text;
    const savedNote = await n.save();
    return savedNote;
  } catch (err) {
    throw err;
  }
}
