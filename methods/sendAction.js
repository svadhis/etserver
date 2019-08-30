const queryDb = require('./queryDb')

const sendAction = async (io, action) => {
    queryDb(
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
    })
}

module.exports = sendAction