const sendState = require("../methods/sendState")
const queryDb = require("../methods/queryDb")

const socketListener = io => {

    io.on("connection", socket => {

        // Create room
        socket.on("new-room", room => {
            queryDb([{
                collection: 'rooms',
                type: 'insertOne',
                filter: {
                    number: room,
                    owner: socket.id,
                    players: [],
                    view: 'Lobby',
                    status: 'opened'
                },
                callback: () => {
                    socket.join(room)
                    sendState(io, room)
                }
            }])
        })
    
        // Join room
        socket.on("join-room", data => {
            queryDb([{
                type: 'findOne',
                filter: {
                    number: data.room
                },
                callback: doc => {
                    console.log(doc)
                    if (doc) {
                        let players = doc.players.slice()
                        let playerExists = 0
                        players.forEach(player => {
                            if (player.name === data.player) {
                                playerExists = 1
                            }
                        })

                        if (!playerExists) {
                            players.push({id: socket.id, name: data.player, connected: 1})
                            queryDb([
                                {
                                    type: 'updateOne',
                                    filter: {
                                        number: data.room
                                    },
                                    arg: {
                                        $set: { players: players }
                                    },
                                    callback: () => {
                                        socket.join(data.room)
                                        sendState(io, data.room, data.player)
                                    }
                                }
                            ])
                        }
                        else {
                            socket.emit('flash', {
                                type: 'error',
                                message: "Ce nom est déjà pris"
                            })
                        }
                    }
                    else {
                        socket.emit('flash', {
                            type: 'error',
                            message: "Le salon " + data.room + " n'existe pas"
                        })
                    }			
                }
            }])
        })
    
        // Leave room
        socket.on("leave-room", data => {
            queryDb([{
                type: 'findOne',
                filter: {
                    number: data.room
                },
                callback: doc => {
                    let players = doc.players.slice()
                    players.forEach((player, i) => {
                        if (player.name === data.player) {
                            players.splice(i)
                        }
                    })
                    queryDb([
                        {
                            type: 'updateOne',
                            filter: {
                                number: data.room
                            },
                            arg: {
                                $set: { players: players }
                            },
                            callback: doc => {
                                socket.leave(data.room)
                                sendState(io, data.room)
                            }
                        }
                    ])    
                }
            }])
        })
        
        // Client disconnects
        socket.on("disconnect", () => {
            queryDb([{
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
                            }
                        })
                        queryDb([{
                            type: 'updateOne',
                            filter: {
                                number: doc.number
                            },
                            arg: {
                                $set: {players: players}
                            }
                        }])
                    })
                }
            }])

            console.log("Client disconnected")
        })
    })

}

module.exports = socketListener