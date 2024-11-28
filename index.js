const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const defaultPort = 3000; 
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const upload = multer();
const app = express();
const program = new Command();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Налаштування Swagger
const options = {
    definition: {
        openapi: '3.0.0', // Версія OpenAPI
        info: {
            title: 'Notes API',  // Назва вашого API
            version: '1.0.0',    // Версія вашого API
            description: 'API для створення та керування нотатками', // Опис
        },
    },
    // Шлях до файлів, де ми будемо писати коментарі Swagger
    apis: ['./index.js'], // або шлях до ваших роутерів, якщо вони в окремих файлах
};

// Створення документації
const swaggerSpec = swaggerJsdoc(options);


program
    .requiredOption('-h, --host <host>', 'Server host', HOST)
    .requiredOption('-p, --port <port>', 'Server port', PORT)
    .requiredOption('-c, --cache <cacheDir>', 'Cache directory', './cache')
    .parse(process.argv);

const { host, port: cliPort, cache } = program.opts(); 

const portToUse = cliPort || defaultPort;
const notesDir = path.resolve(cache);

if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
}

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
// Роут для Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати нотатку за її назвою
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Вміст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */

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

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати всі нотатки
 *     responses:
 *       200:
 *         description: Список нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Назва нотатки
 *                   text:
 *                     type: string
 *                     description: Текст нотатки
 */

app.get('/notes', (req, res) => {
    const notes = fs.readdirSync(notesDir).map(name => ({
        name,
        text: fs.readFileSync(path.join(notesDir, name), 'utf-8'),
    }));
    res.status(200).json(notes);
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Нотатка створена
 *       400:
 *         description: Невірні параметри
 */

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

app.get('/', (req, res) => {
    res.send('Welcome to the Notes API');
});


app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
