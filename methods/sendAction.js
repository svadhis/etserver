const sendAction = async (database, action, io, roomNumber) => {
    database.collection("rooms").findOne({number: roomNumber})
        .then(res => {
            io.to(roomNumber).emit("action", {
                action: action,
                payload: res
            });
        })
        .catch(error => {
            console.log(error)
        })
}

module.exports = sendAction