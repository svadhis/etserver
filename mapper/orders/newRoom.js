const newRoom = (socket, data) => {
    
    // Join io room
    socket.join(data.room.number)

    return (
        [
            {
                collection: 'rooms',
                method: 'insert',
                documents: [
                    {
                        data: data.room
                    }
                ]
            }
        ]
    )
}

module.exports = newRoom