const queryDb = require("../methods/queryDb")
const sendState = require("../methods/sendState")

const getRooms = require('./queries/getRooms')
const updateRoom = require('./queries/updateRoom')

const shuffle = array => {
    let currentIndex = array.length
	let temporaryValue, randomIndex

	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1
        
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}

	return array
  }

module.exports = async io => {

    let disconnected = []

    let activeRooms = await getRooms()

    let activeEntries = {}
    
    for (let key of Object.keys(activeRooms)) { activeEntries[key] = {steps: {drawing: 0, data: 0, vote: 0}} }

    io.on("connection", socket => {

        // Next view
        const nextView = (view, step) => {
            activeRooms[socket.room].view = view || activeRooms[socket.room].view
            activeRooms[socket.room].step = step || ''

            console.log(socket.room + ' :: UPDATED [ view: ' + activeRooms[socket.room].view + ', step: ' + activeRooms[socket.room].step + ' ]')
            updateRoom(io, socket.room, activeRooms[socket.room])
        }        

        // Set view
        socket.on("set-view", ([view, data]) => {
            let players = activeRooms[socket.room].players.slice()
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
                    })
                    activeRooms[socket.room].players = players
                    nextView(view)
                    break

                case 'StartPresentation':
                    let presenting = activeRooms[socket.room].presentOrder.shift()
                    activeRooms[socket.room].presenting = presenting
                    activeRooms[socket.room].presentation = { ...activeEntries[socket.room][presenting], steps: [0, 0, 0] }
                    nextView(view)
                    break

                case 'MakeVote':
                    activeRooms[socket.room].presentation = []
                    activeRooms[socket.room].solutions = activeEntries[socket.room]
                    nextView(view)
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
                        player[data.step] && player[data.step].value && count++
                    }   
                })
            }
            else if (data.step === 'presentation') {
                if (data.value !== 'end') {
                    room.presentation.steps[data.value] = 1
                }   

                count = room.players.length
            }
            else if (data.step === 'vote') {
                for (let [key, value] of Object.entries(data.value)) { room.results[key] = room.results[key] + value || value }
                room.voted++

                count = room.voted
            }
            else {
                activeEntries[socket.room] = {
                    ...activeEntries[socket.room],
                    steps: {
                        ...activeEntries[socket.room].steps,
                        [data.step]: activeEntries[socket.room].steps[data.step] + 1
                    },
                    [socket.name]: {
                        ...activeEntries[socket.room][socket.name],
                        [data.step]: data.value
                    }
                }

                count = activeEntries[socket.room].steps[data.step]
            }
            
            console.log(socket.room + ' :: RECEIVED DATA [ ' + data.step + ' ]', data.value)

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

                    case 'MakePresentation':
                        data.value === 'end' ? nextView('EndPresentation') : nextView()
                        break
                        
                    case 'MakeVote':
                        console.log(socket.room + ' :: STEP CLOSED [ ' + data.step + ' ]')
                        console.log(room.results)
                        nextView('Results')
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
                presentOrder: [],
                presenting: '',
                presentation: {},
                solutions: {},
                results: {},
                voted: 0,
                instructions: true,
                subtitles: true
            }

            queryDb({
                collection: 'rooms',
                type: 'insertOne',
                filter: room,
                callback: () => {
                    activeRooms[roomNumber] = room
                    activeEntries[roomNumber] = {steps: {drawing: 0, data: 0, vote: 0}}
                    socket.room = roomNumber
                    socket.status = 'owner'

                    console.log(roomNumber + ' :: ROOM CREATED')

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

                    console.log(data.room + ' :: JOINED [ ' + data.player + ' ]')
                    
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

            console.log(socket.room + ' :: LEFT [ ' + socket.name + ' ]')

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
                room.presentOrder = shuffle(room.players.slice()).map(player => player.name)

                console.log(socket.room + ' :: GAME STARTED')

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

        // Toggle subtitles
        socket.on("toggle-subtitles", bool => {

            if (socket.room) {
                let room = activeRooms[socket.room]

                room.subtitles = bool

                updateRoom(io, socket.room, room)
            }
        })

        // Restart room
        socket.on("restart", () => {

            activeRooms[socket.room] = {

            }

            updateRoom(io, socket.room, activeRooms[socket.room])
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