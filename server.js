const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const fetch = require("node-fetch")
const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectID;
const port = process.env.PORT || 4001
const index = require("./routes/index")
const orders = require("./mapper/orders")
const sendAction = require("./methods/sendAction")
const setState = require("./methods/setState")
const dispatch = require("./methods/dispatch")
const app = express()
app.use(index)
const server = http.createServer(app)
const io = socketIo(server)

let database = null

// Connect to database
MongoClient.connect("mongodb://localhost:27017", function(error, client) {
    if (error) return funcCallback(error)
    database = client.db("etscope")
})

const disconnectedClients = []

const disconnected = client => {

}

// Handle socket events
io.on("connection", socket => {
    console.log(socket.conn.remoteAddress)

	// Client sends order
	socket.on("order", order => {
		setState(database, order, socket, io)
	})
	
	// Client disconnects
    socket.on("disconnect", () => {
		disconnected(socket.conn.remoteAddress)
		console.log("Client disconnected")
	})
})

server.listen(port, () => console.log(`Listening on port ${port}`))
