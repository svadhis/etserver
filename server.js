const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const ObjectId = require("mongodb").ObjectID;
const port = process.env.PORT || 4001
const index = require("./routes/index")
const sendAction = require("./methods/sendAction")
const queryDb = require("./methods/queryDb")
const app = express()
app.use(index)
const server = http.createServer(app)
const io = socketIo(server)

const disconnectedClients = []

const disconnected = client => {

}

// Handle socket events
io.on("connection", socket => {

	// Create room
	socket.on("new-room", room => {
		queryDb([
			{
				collection: 'rooms',
				type: 'insertOne',
				filter: {
					number: room,
					players: [],
					view: 'Lobby',
					status: 'opened'
				},
				arg: '',
				callback: () => {
					// Join io room
					socket.join(room)
					sendAction(io, room)
				}
			}
		])
	})

	// Join room
	socket.on("join-room", data => {
		queryDb([
			{
				collection: 'rooms',
				type: 'updateOne',
				filter: {
					number: data.room
				},
				arg: {
					$addToSet: { players: data.player }
				},
				callback: () => {
					// Join io room
					socket.join(data.room)
					sendAction(io, room)
				}
			}
		])
	})
	
	// Client disconnects
    socket.on("disconnect", () => {
		disconnected(socket.conn.remoteAddress)
		console.log("Client disconnected")
	})
})

server.listen(port, () => console.log(`Listening on port ${port}`))
