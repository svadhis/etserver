const queryDb = require('./queryDb')

module.exports = async (db, io, action) => {
    queryDb(db, 
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