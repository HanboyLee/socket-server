const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5500;
const { createServer } = require('http');
const { userInfo } = require('./utils/common.js');

//The express will nested to http in 3000 port start, and then  console print the infomation on start.
app.use(cors());
app.use('/', () => {
    console.log('app use');
});
const server = createServer(app);
// The server will send to socker.io handle at start.

const io = require('socket.io')(server, {
    cors: {
        origin: `*`,
    },
});

io.on(`connection`, (socket) => {
    console.log(`User Connection:${socket.id} success`);
    //    用戶加入到聊天室
    socket.on('joinRoom', ({ roomname, username }) => {
        socket.join(roomname);

        //當有人加入到房間就發送目前的用戶數給當前在房間內的所有人
        const inRoomUser = io.sockets.adapter.rooms.get(roomname);
        const numberOfUser = [...new Set([...inRoomUser.entries()].flat())].length;

        //除自己以外其他在聊天室將接收到這些訊息
        const data = userInfo({
            id: socket.id,
            username,
            roomId: roomname,
            message: `用戶${username}加入聊天室`,
        });

        //讓其他人得知有任進入聊天室
        socket.broadcast.emit('systemMessage', data);
        io.emit('numberOfUser', numberOfUser);
    });

    //發送訊息除
    socket.on('sendMessage', async (messageData) => {
        const data = userInfo({
            id: socket.id,
            username: messageData.username,
            roomId: messageData.roomname,
            message: messageData.message,
        });
        //自己以外給在房間所有的人
        socket.to(data.roomId).emit('receiveMessage', data);
        //發送自己給自己
        socket.emit('getMessage', data);
    });

    //離開房間
    socket.on('leaveRoom', async ({ username, roomname }) => {
        const data = userInfo({
            id: socket.id,
            username,
            roomId: roomname,
            message: `用戶${username}離開聊天室`,
        });
        //先發送給在房間的人
        await socket.broadcast.emit('systemMessage', data);

        //當前用戶離開房間,且將從發送新的用戶數到目前房間內
        socket.leave(data.roomId);

        const inRoomUser = io.sockets.adapter.rooms.get(data.roomId);
        const numberOfUser = [...new Set([...inRoomUser.entries()].flat())].length;
        io.emit('numberOfUser', numberOfUser);
        console.log(`User ${data.username} leave the ${data.roomname}`);
    });

    //用戶已關閉連接
    socket.on('disconnection', () => {
        console.log('disconnection'); // undefined
    });
});

server.listen(PORT, () => {
    console.log(`Server on ${PORT}`);
});
