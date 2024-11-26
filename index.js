const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const upload = multer();
const app = express();
const program = new Command();

program
    .requiredOption('-h, --host <host>', 'Server host')
    .requiredOption('-p, --port <port>', 'Server port')
    .requiredOption('-c, --cache <cacheDir>', 'Cache directory')
    .parse(process.argv);

const { host, port, cache } = program.opts();

const notesDir = path.resolve(cache);
if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.get('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Note not found');
    }
    const noteContent = fs.readFileSync(notePath, 'utf-8');
    res.send(noteContent);
});

app.put('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Note not found');
    }
    fs.writeFileSync(notePath, req.body.text, 'utf-8');
    res.send('Note updated');
});

app.delete('/notes/:name', (req, res) => {
    const notePath = path.join(notesDir, req.params.name);
    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Note not found');
    }
    fs.unlinkSync(notePath);
    res.send('Note deleted');
});

app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(notesDir).map(name => ({
        name,
        text: fs.readFileSync(path.join(notesDir, name), 'utf-8'),
    }));
    res.status(200).json(notes);
});

app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;
    if (!note_name || !note) {
        return res.status(400).send('Both "note_name" and "note" fields are required');
    }
    const notePath = path.join(notesDir, note_name);
    if (fs.existsSync(notePath)) {
        return res.status(400).send('Note already exists');
    }
    fs.writeFileSync(notePath, note, 'utf-8');
    res.status(201).send('Note created');
}); 


app.get('/UploadForm.html', (req, res) => {
    const formPath = path.resolve(__dirname, 'UploadForm.html');
    if (!fs.existsSync(formPath)) {
        return res.status(404).send('Upload form not found');
    }
    res.sendFile(formPath);
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});
