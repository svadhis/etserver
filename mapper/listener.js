const sendState = require("../methods/sendState")
const queryDb = require("../methods/queryDb")

let activeRooms = {}

let disconnected = []

const socketListener = io => {

    io.on("connection", socket => {

        const setView = (view = activeRooms[socket.room].view, step = '') => {
            activeRooms[socket.room].view = view
            activeRooms[socket.room].step = step

            queryDb({
                collection: 'rooms',
                type: 'replaceOne',
                filter: {
                    number: socket.room
                },
                arg: activeRooms[socket.room],
                callback: () => {
                    sendState(io, socket.room)
                }
            })
        }        

        // Set view
        socket.on("set-view", ([view, data]) => {

            const handleData = () => {
                switch (view) {
                    case 'MakeProblems':
                        queryDb({
                            collection: 'problems',
                            type: 'aggregate',
                            filter: [{$sample: {size: data}}],
                            callback: docs => {
                                let problems = []
                                docs.forEach(doc => {
                                    problems.push(doc.phrase)
                                })
                                activeRooms[socket.room].problems = problems
                                setView(view)
                            }
                        })  
                        break;
                
                    default:
                        break;
                }

                /* if (data === '') {
                    queryDb({
                        collection: 'rooms',
                        type: 'findOne',
                        filter: {
                            number: socket.room
                        },
                        callback: doc => {
                            socket.room = doc
                            setView()
                        }
                    })
                } */
           
            }    

            if (!activeRooms[socket.room]) {
                queryDb({
                    collection: 'rooms',
                    type: 'findOne',
                    filter: {
                        number: socket.room
                    },
                    callback: doc => {
                        activeRooms[socket.room] = doc
                        handleData()
                    }
                })
            }
            else {
                handleData()
            }
        })

        // End step
        socket.on("end-step", () => {
            activeRooms[socket.room].step = 'end'

            queryDb({
                collection: 'rooms',
                type: 'replaceOne',
                filter: {
                    number: socket.room
                },
                arg: activeRooms[socket.room],
                callback: () => {
                    sendState(io, socket.room)
                }
            })
        })

        // Send data
        socket.on("send-data", data => {
            let count = 0
            activeRooms[socket.room].players.forEach(player => {
                if (player.name === socket.name) {
                    player[data.step] = data.value
                }
                player[data.step] && count++
            })

            activeRooms[socket.room].players.length === count &&
            setView('Home')
        })

        // Create room
        socket.on("new-room", room => {

            queryDb({
                collection: 'rooms',
                type: 'insertOne',
                filter: {
                    number: room,
                    owner: socket.id,
                    players: [],
                    view: 'Lobby',
                    step: '',
                    status: 'opened',
                    instructions: true
                },
                callback: () => {
                    socket.room = room
                    socket.status = 'owner'
                    socket.join(room)
                    sendState(io, room)
                }
            })
        })
    
        // Join room
        socket.on("join-room", data => {

            queryDb({
                collection: 'rooms',
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
                            !playerExists && players.push({
                                id: socket.id,
                                name: data.player
                            })
                            queryDb({
                                collection: 'rooms',
                                type: 'updateOne',
                                filter: {
                                    number: data.room
                                },
                                arg: {
                                    $set: { players: players }
                                },
                                callback: doc => {
                                    socket.room = data.room
                                    socket.status = 'player'
                                    socket.name = data.player
                                    socket.join(data.room)
                                    sendState(io, data.room)

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
                collection: 'rooms',
                type: 'findOne',
                filter: {
                    number: socket.room
                },
                callback: doc => {
                    let players = doc.players.slice()
                    players.forEach((player, i) => {
                        if (player.name === socket.name) {
                            players.splice(i, 1)
                        }
                    })
                    queryDb({
                        collection: 'rooms',
                        type: 'updateOne',
                        filter: {
                            number: socket.room
                        },
                        arg: {
                            $set: { players: players }
                        },
                        callback: doc => {
                            socket.leave(socket.room)
                            sendState(io, socket.room)

                            io.to(socket.room).emit('flash', {
                                target: 'owner',
                                type: 'info',
                                message: socket.name + " a quitté le salon"
                            })
                        }
                    })    
                }
            })
        })

        // Start game
        socket.on("start-game", () => {

            if (socket.room) {
                queryDb({
                    collection: 'rooms',
                    type: 'updateOne',
                    filter: {
                        number: socket.room
                    },
                    arg: {
                        $set: { status: 'started', view: 'Starting' }
                    },
                    callback: () => {
                        sendState(io, socket.room)
                    }
                })
            }
        })

        // Toggle instructions
        socket.on("toggle-instructions", bool => {

            if (socket.room) {
                queryDb({
                    collection: 'rooms',
                    type: 'updateOne',
                    filter: {
                        number: socket.room
                    },
                    arg: {
                        $set: { instructions: bool }
                    },
                    callback: () => {
                        sendState(io, socket.room)
                    }
                })
            }
        })
        
        // Client disconnects
        socket.on("disconnect", () => {

            if (socket.room) {
                disconnected.push(socket.room)

                io.to(socket.room).emit('flash', {
                    target: 'owner',
                    type: 'warning',
                    message: socket.name + " s'est deconnecté"
                })
            }
            console.log("Client disconnected")
        })
    })

}

module.exports = socketListener