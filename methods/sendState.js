const queryDb = require('./queryDb')

const sendState = (io, room, data) => {
    queryDb({
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

module.exports = sendState