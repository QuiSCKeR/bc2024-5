const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const notesDir = path.resolve(cache);
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

app.get('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not Found');
    }
    const noteText = fs.readFileSync(notePath, 'utf8');
    res.send(noteText);
});

app.put('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not Found');
    }
    fs.writeFileSync(notePath, req.body.text);
    res.send('Note updated');
});

app.delete('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Not Found');
    }
    fs.unlinkSync(notePath);
    res.send('Note deleted');
});

app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(notesDir).map(name => ({
        name,
        text: fs.readFileSync(path.join(notesDir, name), 'utf8'),
    }));
    res.json(notes);
});

app.post('/write', (req, res) => {
    const { note_name, note } = req.body;
    const notePath = path.join(notesDir, note_name);
    if (fs.existsSync(notePath)) {
        return res.status(400).send('Note already exists');
    }
    fs.writeFileSync(notePath, note);
    res.status(201).send('Note created');
});

app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.resolve('UploadForm.html'));
});
