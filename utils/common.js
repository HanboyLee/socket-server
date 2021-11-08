const { v4: uuidv4 } = require('uuid');

const userInfo = ({ id, username, roomId, message }) => {
    return {
        id,
        username,
        roomId,
        message,
        time: new Date(Date.now()).getHours() + ':' + new Date(Date.now()).getMinutes(),
    };
};

module.exports = { userInfo };
