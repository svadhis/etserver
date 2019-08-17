const startRoom = room => (
    [
        {
            collection: 'rooms',
            method: 'update-room',
            documents: [
                {
                    number: room.number,
                    data: room.content
                }
            ]
        }
    ]
)

module.exports = startRoom