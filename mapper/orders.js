const newRoom = require("./orders/newRoom")
const joinRoom = require("./orders/joinRoom")
const startRoom = require('./orders/startRoom')

const orders = (socket, data) => (
    {
        newRoom: newRoom(socket, data),
        joinRoom: joinRoom(socket, data),
        startRoom: startRoom(socket, data)
    }
)

module.exports = orders