const sendState = require("../methods/sendState")
const queryDb = require("../methods/queryDb")

let disconnected = []

const socketListener = io => {

    io.on("connection", socket => {

        // Create room
        socket.on("new-room", room => {
            queryDb({
                type: 'insertOne',
                filter: {
                    number: room,
                    owner: socket.id,
                    players: [],
                    view: 'Lobby',
                    status: 'opened'
                },
                callback: () => {
                    socket.room = {
                        number: room,
                        status: 'owner'
                    }
                    socket.join(room)
                    sendState(io, room)
                }
            })
        })
    
        // Join room
        socket.on("join-room", data => {
            queryDb({
                type: 'findOne',
                filter: {
                    number: data.room
                },
                callback: doc => {
                    console.log(doc)
                    if (doc) {
                        let players = doc.players.slice()
                        let playerExists = 0
                        let playerDisconnected = 0
                        players.forEach(player => {
                            if (player.name === data.player) {
                                playerExists = 1
                                disconnected.forEach((room, i) => {
                                    if (room.number === data.room && room.name === data.player) {                           
                                        playerDisconnected = 1
                                        disconnected.splice[i, 1]
                                    }
                                })  
                            }
                        })

                        if (!playerExists || playerDisconnected) {
                            !playerExists && players.push({id: socket.id, name: data.player})
                            queryDb({
                                type: 'updateOne',
                                filter: {
                                    number: data.room
                                },
                                arg: {
                                    $set: { players: players }
                                },
                                callback: doc => {
                                    socket.room = {
                                        number: data.room,
                                        status: 'player',
                                        name: data.player
                                    }
                                    socket.join(data.room)
                                    sendState(io, data.room, data.player)

                                    io.to(data.room).emit('flash', {
                                        target: 'owner',
                                        type: 'info',
                                        message: data.player + " a rejoint le salon"
                                    })
                                }
                            })
                        }
                        else {
                            socket.emit('flash', {
                                target: 'player',
                                type: 'error',
                                message: "Ce nom est déjà pris"
                            })
                        }
                    }
                    else {
                        socket.emit('flash', {
                            target: 'player',
                            type: 'error',
                            message: "Le salon " + data.room + " n'existe pas"
                        })
                    }			
                }
            })
        })
    
        // Leave room
        socket.on("leave-room", () => {
            queryDb({
                type: 'findOne',
                filter: {
                    number: socket.room.number
                },
                callback: doc => {
                    let players = doc.players.slice()
                    players.forEach((player, i) => {
                        if (player.name === socket.room.name) {
                            players.splice(i)
                        }
                    })
                    queryDb({
                        type: 'updateOne',
                        filter: {
                            number: socket.room.number
                        },
                        arg: {
                            $set: { players: players }
                        },
                        callback: doc => {
                            socket.leave(socket.room.number)
                            sendState(io, socket.room.number)

                            io.to(socket.room.number).emit('flash', {
                                target: 'owner',
                                type: 'info',
                                message: socket.room.name + " a quitté le salon"
                            })
                        }
                    })    
                }
            })
        })
        
        // Client disconnects
        socket.on("disconnect", () => {

            if (socket.room) {
                disconnected.push(socket.room)

                io.to(socket.room.number).emit('flash', {
                    target: 'owner',
                    type: 'warning',
                    message: socket.room.name + " s'est deconnecté"
                })
            }

            /* queryDb({
                type: 'find',
                filter: {
                    'players.id': socket.id
                },
                callback: docs => {
                    docs.forEach(doc => {
                        let players = doc.players.slice()
                        players.forEach((player, i) => {
                            if (player.id === socket.id) {
                                players.splice(i)
                                queryDb({
                                    type: 'updateOne',
                                    filter: {
                                        number: doc.number
                                    },
                                    arg: {
                                        $set: { players: players }
                                    },
                                    callback: () => {
                                        console.log("Client disconnected")
                                    }
                                })
                            }
                        })
                    })
                }
            }) */
            console.log("Client disconnected")
        })
    })

}

module.exports = socketListener