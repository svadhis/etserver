const joinRoom = (socket, data) => {
    
    // Join io room
    socket.join(data.number)

    return (
        [
            {
                collection: 'rooms',
                method: 'update-room',
                documents: [
                    {
                        number: data.number,
                        data: data.room
                    }
                ]
            },
            {
                collection: 'players',
                method: 'insert',
                documents: [
                    {
                        data: data.player
                    }
                ]
            }
        ]
    )
}

module.exports = joinRoom