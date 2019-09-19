const queryDb = require('../../methods/queryDb')

const updateRoom = (db, io, number, room) => {
    queryDb(db, {
        collection: 'rooms',
        type: 'replaceOne',
        filter: {
            number: number
        },
        arg: room,
        callback: () => {
            //sendState(io, number)
            io.to(number).emit("action", {
                action: 'updateRoomState',
                payload: {room: room}
            })
        }
    })
}

module.exports = updateRoom