const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Serve static files (quiz, admin, etc)
app.use(express.static(__dirname));

// WebSocket logic
wss.on('connection', (ws) => {
  let userId = null;
  let userFile = null;
  let userData = null;

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      // Логируем все входящие сообщения для отладки
      console.log('WS received:', JSON.stringify(data, null, 2));
      if (data.type === 'contact_info') {
        // Validate and create user file
        userId = uuidv4();
        userFile = path.join(DATA_DIR, userId + '.json');
        userData = {
          id: userId,
          name: data.payload.name,
          email: data.payload.email,
          phone: data.payload.phone,
          answers: [],
          completed: false,
          createdAt: new Date().toISOString()
        };
        fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
        ws.send(JSON.stringify({ type: 'ack', payload: { status: 'ok', id: userId } }));
      } else if (data.type === 'answer' && userFile) {
        // Append answer
        userData.answers.push({
          questionIndex: data.payload.questionIndex,
          selectedOption: data.payload.selectedOption,
          tag: data.payload.tag,
          comment: data.payload.comment || ''
        });
        fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
        ws.send(JSON.stringify({ type: 'ack', payload: { status: 'ok' } }));
      } else if (data.type === 'extended' && userFile) {
        // Save extended answers
        userData.extended = data.payload;
        fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
        ws.send(JSON.stringify({ type: 'ack', payload: { status: 'ok' } }));
      } else if (data.type === 'complete' && userFile) {
        userData.completed = true;
        fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
        ws.send(JSON.stringify({ type: 'ack', payload: { status: 'ok' } }));
      } else {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid state or message' } }));
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid JSON' } }));
    }
  });
});

// Admin API: get all users (for quiz_admin.html)
app.get('/api/users', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const users = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f)));
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      answers: data.answers,
      completed: data.completed,
      createdAt: data.createdAt
    };
  });
  res.json(users);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
}); 