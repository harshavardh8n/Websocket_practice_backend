import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}

let allSockets: User[] = [];

wss.on('connection', (socket) => {
  console.log("New client connected");

  socket.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      
      if (!parsedMessage.type || !parsedMessage.payload) {
        throw new Error('Invalid message format');
      }

      if (parsedMessage.type === "join") {
        if (!parsedMessage.payload.roomId) {
          throw new Error('Missing roomId in join payload');
        }
        allSockets.push({ socket, room: parsedMessage.payload.roomId });
        console.log(`Client joined room: ${parsedMessage.payload.roomId}`);
      } else if (parsedMessage.type === "chat") {
        const currentRoom = allSockets.find((x) => x.socket === socket)?.room;
        if (!currentRoom) {
          throw new Error('User not in a room');
        }
        for (const user of allSockets) {
          if (user.room === currentRoom) {
            user.socket.send(parsedMessage.payload.message || "");
          }
        }
      } else {
        throw new Error(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error processing message:", error.message);
      socket.send(JSON.stringify({ error: error.message }));
    }
  });

  socket.on('close', () => {
    console.log("Client disconnected");
    allSockets = allSockets.filter((x) => x.socket !== socket);
  });

  socket.on('error', (err) => {
    const error = err as Error;
    console.error("Socket error:", error.message);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
