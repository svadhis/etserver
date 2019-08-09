const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const port = process.env.PORT || 4001;
const index = require('./routes/index');
const app = express();
app.use(index);
const server = http.createServer(app);
const io = socketIo(server); // < Interesting!

let database = null;

MongoClient.connect('mongodb://localhost:27017', function(error, client) {
	if (error) return funcCallback(error);
	database = client.db('etscope');
});


const sendAction = async (socket) => {
	database.collection('rooms').findOne()
		.then(res => {
			socket.emit('action', {
				action: 'updateLocalState',
				payload: {
					text: res,
					component: res['456456'].status
				}
			})
			console.log(res['456456'].status)
		})
		.catch(error => {
			console.log(error)
		})
};

io.on('connection', (socket) => {
	console.log('New client connected');
	sendAction(socket);
	socket.on('disconnect', () => console.log('Client disconnected'));
});

server.listen(port, () => console.log(`Listening on port ${port}`));
