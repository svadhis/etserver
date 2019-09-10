const queryDb = require("../methods/queryDb")
const sendState = require("../methods/sendState")

const getRooms = require('./queries/getRooms')
const updateRoom = require('./queries/updateRoom')

const socketListener = async io => {

    let disconnected = []

    let activeRooms = await getRooms()

    let activeEntries = {}
    
    for (let [key, value] of Object.entries(activeRooms)) { activeEntries[key] = { drawing: 0, data: 0, vote: 0 } }

    io.on("connection", socket => {

        // Next view
        const nextView = (view, step) => {
            activeRooms[socket.room].view = view || activeRooms[socket.room].view
            activeRooms[socket.room].step = step || ''

            updateRoom(io, socket.room, activeRooms[socket.room])
        }        

        // Set view
        socket.on("set-view", ([view, data]) => {
            const players = activeRooms[socket.room].players
            switch (view) {
                case 'MakeProblem':
                    queryDb({
                        collection: 'problems',
                        type: 'aggregate',
                        filter: [{$sample: {size: players.length}}],
                        callback: docs => {
                            players.forEach((player, i) => {
                                player.problem = docs[i]
                            })

                            activeRooms[socket.room].players = players
                            nextView(view)
                        }
                    })  
                    break

                case 'GetProblem':
                    const random = Math.floor(Math.random() * (players.length - 1)) + 1
                    players.forEach((player, i) => {
                        const index = i + random > players.length - 1 ? i + random - players.length : i + random
                        let phrase = players[index].problem.phrase.split('**')
                        player.entry = { problem: phrase[0] + ' ' + players[index].problem.value + ' ' + phrase[1] }

                        activeRooms[socket.room].players = players
                        nextView(view)
                    })
                    break
            
                default:
                    nextView(view)
                    break
            }
        })

        // End step
        socket.on("end-step", () => { 
            nextView(null, 'end')
        })

        // Send data
        socket.on("send-data", data => {
            let count = 0
            let room = activeRooms[socket.room]

            if (data.step === 'problem') {
                room.players.forEach(player => {
                    if (player.name === socket.name) {
                        player[data.step].value = data.value
                        count++
                    }
                    else {
                        player[data.step].value && count++
                    }   
                })
            }
            else {
                activeEntries[socket.room] = {
                    ...activeEntries[socket.room],
                    [data.step]: activeEntries[socket.room][data.step] + 1,
                    [socket.name]: {
                        ...activeEntries[socket.room][socket.name],
                        [data.step]: data.value
                    }
                }

                count = activeEntries[socket.room][data.step]

                console.log(activeEntries[socket.room])
            }

            if (room.players.length === count) {
                switch (room.view) {
                    case 'MakeProblem':
                        nextView('StartDrawing')
                        break
                
                    case 'MakeDrawing':
                        nextView('StartData')
                        break

                    case 'MakeData':
                        nextView('PresentingStep')
                        break
                }
            }   
        })

        // Create room
        socket.on("new-room", roomNumber => {

            let room = {
                number: roomNumber,
                owner: socket.id,
                players: [],
                view: 'Lobby',
                step: '',
                status: 'opened',
                instructions: true
            }

            queryDb({
                collection: 'rooms',
                type: 'insertOne',
                filter: room,
                callback: () => {
                    activeRooms[roomNumber] = room
                    activeEntries[roomNumber] = { drawing: 0, data: 0, vote: 0 }
                    socket.room = roomNumber
                    socket.status = 'owner'
                    socket.join(roomNumber)
                    sendState(io, roomNumber)
                }
            })
        })
    
        // Join room
        socket.on("join-room", data => {

            let room = activeRooms[data.room]

            if (room) {
                let players = room.players.slice()
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

                    room.players = players

                    socket.room = data.room
                    socket.status = 'player'
                    socket.name = data.player
                    socket.join(data.room)
                    
                    updateRoom(io, data.room, room)

                    io.to(data.room).emit('flash', {
                        target: 'owner',
                        type: 'info',
                        message: data.player + " a rejoint le salon"
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
        })
    
        // Leave room
        socket.on("leave-room", () => {

            let room = activeRooms[socket.room]
            let players = room.players.slice()

            players.forEach((player, i) => {
                if (player.name === socket.name) {
                    players.splice(i, 1)
                }
            })

            room.players = players

            socket.leave(socket.room)
           
            updateRoom(io, socket.room, room)

            io.to(socket.room).emit('flash', {
                target: 'owner',
                type: 'info',
                message: socket.name + " a quitté le salon"
            })
        })

        // Start game
        socket.on("start-game", () => {

            if (socket.room) {

                let room = activeRooms[socket.room]

                room.status = 'started'
                room.view = 'CreatingStep'

                updateRoom(io, socket.room, room)
            }
        })

        // Toggle instructions
        socket.on("toggle-instructions", bool => {

            if (socket.room) {
                let room = activeRooms[socket.room]

                room.instructions = bool

                updateRoom(io, socket.room, room)
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