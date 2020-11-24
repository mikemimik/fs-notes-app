import React, { useState, useEffect } from 'react'
import Container from '@material-ui/core/Container'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  content: {
    padding: theme.spacing(8, 0, 6),
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
  buttonField: {
    marginTop: theme.spacing(1),
  },
}))

export default function NoteForm (props) {
  const classes = useStyles()
  const [ note, setNote ] = useState('');
  const [ error, setError ] = useState(undefined);

  async function getNoteById(id) {
    try {
      const response = await fetch(`/api/notes/${id}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
    
      setNote(json.data.text);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getNoteById(props.match.params.id);
  }, [props.match.params.id]);

  async function handleSubmit(e) {
    try {
      e.preventDefault();
      const updateId = props.match.params.id
      const url = updateId ? `/api/notes/${updateId}` : '/api/notes';
      const method = updateId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: note }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      props.history.push('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Container className={classes.content} maxWidth='md'>
      <form onSubmit={handleSubmit}>
        <div>
          {error && <Typography color="error">{error}</Typography>}
          <Typography component='h6' variant='h6' align='left' color='textPrimary'>
            Add a Note
          </Typography>
        </div>
        <div>
          <TextField
            id='standard-multiline-flexible'
            label='Note text'
            multiline
            rowsMax='2'
            className={classes.textField}
            margin='normal'
            value={note}
            onChange={(e) => {setNote(e.target.value);}}
          />
        </div>
        <Button
          color="primary"
          type="submit"
        >
          Add Note
        </Button>
      </form>
    </Container>
  )
}