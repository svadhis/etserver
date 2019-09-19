const queryDb = require('./queryDb')

module.exports = (db, io, room, data) => {
    queryDb(db, {
        collection: 'rooms',
        type: 'findOne',
        filter: {number: room},
        arg: '',
        callback: doc => {
            io.to(room).emit("action", {
                action: 'updateRoomState',
                payload: {room: doc, data: data}
            })
        }
    })
}