const queryDb = require('./queryDb')

const sendState = async (io, roomNumber) => {
    queryDb([
        {
            collection: 'rooms',
            type: 'findOne',
            filter: {number: roomNumber},
            arg: '',
            callback: doc => {
                io.to(roomNumber).emit("action", {
                    action: 'updateRoomState',
                    payload: doc
                });
            }
    }])
}

module.exports = sendState