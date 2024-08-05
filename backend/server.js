const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const http = require('http');
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const {CurrentOnline,CurrentUserSockets, onlineChat} = require("./controllers/chatControllers")
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const WebSocket = require('ws');
const fs = require("fs")
const { connect } = require("http2");
const { handleMessageExternal,connections,Activeconnections } = require("./controllers/messageControllers");
const { updatePubkey } = require("./controllers/userControllers");
const { connection } = require("mongoose");

dotenv.config();
connectDB();
servertoIP = new Map()
IPtoserver = {};
let servertoSocket = {}
servername = process.env.SERVER_NAME;

const app = express();

app.use(express.json()); // to accept json data

// app.get("/", (req, res) => {
//   res.send("API Running!");
// });

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT;
const EXTERNAL_WS_PORT = process.env.EXTERNAL_WS_PORT;
const server = http.createServer(app);



const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  
  const pathname = request.url;
  console.log(pathname)
  if (pathname == '/'){
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);

    
  });
}
});

wss.on('connection',async (wss, req) => {
  console.log('WebSocket connection established.');
  let ip = req.socket.remoteAddress.toString().replace('::ffff:', '');
 
  wss.ip = ip;
  servername = IPtoserver.get(ip)
  console.log("the ip is ", ip)
  console.log("the servername is" + servername)
  
  
  wss.on('message', (message) => {
    console.log("i am receiving presence")
    console.log(`Received message: ${message}`);
    console.log("ip for message is",wss.ip)
    handleRequest(wss,JSON.parse(message))
    //Handle received message here
  });

   wss.on('close', () => {
    console.log("connection closed")
    console.log('WebSocket connection closed.');
    console.log("the ip is ",wss.ip)
    CurrentOnline[IPtoserver.get(ip)] = []
  
  });

  wss.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
  });

  
});


function handleRequest(ws, msg) {
 
  if(msg['tag']){
  switch (msg.tag) {
    case 'message':
      handleMessage(ws, msg);
      break;
    case 'file':
      handleFile(ws, msg);
      break;
    case 'check':
      handleCheck(ws, msg);
      break;
    case 'attendance':
      handleAttendance(ws, msg);
      break;
    case 'presence':
      handlePresence(ws, msg);
      console.log("why connection is closing")
      break;
    default:
      console.log('Unknown tag:', msg.tag, ws.ip);
  }
}else{
  console.log('Invalid message')
}
}

async function handleMessage(ws, msg) {
  try {
    let pubkey = "none"
   
  username = msg.from.split("@")[0]
  servername = msg.from.split("@")[1]
  if (CurrentOnline[servername]){

    const index = CurrentOnline[servername].findIndex(obj => obj.name ===msg.from );
    if (index >0){
      pubkey = CurrentOnline[servername][index].pubkey
    }


  }
 let message = await  handleMessageExternal(msg,pubkey)
 console.log("the message to is",msg.to)
 
 if (msg.to == 'public'){
  for (nne in CurrentUserSockets){
    CurrentUserSockets[nne].emit("message recieved",message)
  }
 }
 else if(msg.to.split("@")[0] in CurrentUserSockets){
  console.log("finall in here")
  console.log()
  await CurrentUserSockets[msg.to.split("@")[0]].emit("message recieved", message)
  console.log(`Received message from ${msg.from} to ${msg.to}: ${msg.info}`);
 }
}catch(err){
  console.log(err)
}
  // Add further handling logic as needed
}

function handleFile(ws, msg) {
  console.log(`Received file from ${msg.from} to ${msg.to}: ${msg.filename}`);
 // const decryptedFile = this.decrypt(msg.info);
 // fs.writeFileSync(`./${msg.filename}`, decryptedFile);
  console.log('File saved.');
}

function handleCheck(ws, msg) {
  console.log('Received check.' + ws.ip);
  ws.send(JSON.stringify({ tag: 'checked' }));
}

async function handleAttendance(ws, msg) {
  console.log('Received attendance.');
  await broadcastPresence(false);
}


async function handlePresence(ws, msg) {
  console.log('Received presence update.');
 
  
  let servname=IPtoserver.get(ws.ip)
  console.log(servname)
  console.log(msg)

  
  tempArr = []
  msg.presence.forEach(async (p) => {
    userData = {
      name: p.jid,
      pubkey: p.publickey
    }
    
    tempArr.push(userData)
    await updatePubkey(p.jid,p.pubkey)
  });
 
  CurrentOnline[servname] = tempArr;
  console.log("presence completed")
}

async function broadcastPresence(ws,all=true) {
  let tempo = []
  
  if (CurrentOnline['local']){
    const uniquePeople = CurrentOnline['local'].filter((person, index, self) => 
      index === self.findIndex((p) => p.name === person.name)
  );
  

console.log(CurrentOnline['local'].length)
  tempo = await Promise.all(uniquePeople.map((userData) => {
    console.log("inside the hell")
    console.log(userData.name)
     return {
      "nickname":userData.name,
      "jid":userData.name+"@"+process.env.SERVER_NAME,
      "publickey":userData.pubkey
     }   


  })

  )
  const presenceMessage = {
    tag: 'presence',
    presence: tempo,
  };
  if (all){
  Activeconnections.forEach(client => {

    if (client.readyState === WebSocket.OPEN) {
      console.log("to ip ", client.ip)
      console.log("send to this client")
      client.send(JSON.stringify(presenceMessage));
    }
  });
}
else {
  ws.send(JSON.stringify(presenceMessage))
  console.log("the presence message" + presenceMessage)
}
}
}


function sendMessage(to, info) {

  if (connections.has(to)) {
    const ws = connections.get(to);
    const message = {
      tag: 'message',
      from: 'server',
      to: to,
      info: info,
    };
    ws.send(JSON.stringify(message));
  } else {
    console.log(`No connection to server: ${to}`);
  }
}


function reverseMap(originalMap) {
  const reversedMap = new Map();
  
  originalMap.forEach((value, key) => {
      reversedMap.set(value, key);
  });
  
  return reversedMap;
}


async function connectToServers() {
  fs.readFile("ips.json", 'utf8', (err, data) => {
    if (err) throw err; 
    servertoIP = new Map(Object.entries(JSON.parse(data)));

    const reversedMap = new Map(Array.from(servertoIP.entries()).map(([key, value]) => [value, key]));
    IPtoserver = reversedMap;
     
    servertoIP.forEach(async (ip,val) => {
    await MakeConnections(ip,val)

    })
})}



async function ConnectAgain() {
  servertoIP.forEach(async (ip,val) => {
    if (!Activeconnections.has(val)){
    await MakeConnections(ip,val)
    }

    })
 
}


setInterval(() => {
 // ConnectAgain()
  
}, (10000));



async function MakeConnections(ip,val){

  const ws = new WebSocket(`ws://${ip}:${EXTERNAL_WS_PORT}`);

  ws.on('open', () => {
    Activeconnections.set(val,ws);
    console.log(`Connected to server: ${ip}`);
    ws.send(JSON.stringify({"tag":"attendance"}))
  //  connections.set(val, ws);
   
    
  });

  ws.on('message', message => {
    ws.ip = ip
    const msg = JSON.parse(message);
    handleRequest(ws, msg);
  });

ws.on('close', () => {
    console.log(`Connection to server ${ip} closed.`);
  
    CurrentOnline[IPtoserver.get(ip)] = []
    

    servertoIP.delete(ip,ws)
    connections.delete(ip);
  });

  ws.on('error', (error) => {
    console.log(`Connection to server ${ip} error:`, error);

    servertoIP.delete(ip,ws)
  //  connections.delete(ip);
    Activeconnections.delete(ip);
  });
}

console.log(`Server is running on port ${PORT}`);




server.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  path:'/socket',
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io",socket.userData);
  
  

  socket.on("setup", (userData) => {
    console.log("setup is called")
  
    CurrentUserSockets[userData.name] = socket;
   

    socket.join(userData._id);
    socket.user = userData
    socket.emit("connected");
    console.log("setting up")
    if (CurrentOnline['local']){
    CurrentOnline['local'].push(userData)
    }
    else{
      CurrentOnline['local'] = [userData]
    }
  broadcastPresence()
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    if (newMessageRecieved.chat){
    
    var chat = newMessageRecieved.chat;
    if (chat.isGroupChat){
      socket.broadcast.emit("message recieved",newMessageRecieved)
    }
    else{
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    }); }
  }


  });

 

  socket.on("disconnect", (userData) => {
    console.log("USER DISCONNECTED");
    if(  CurrentUserSockets[userData.name]){
      delete CurrentUserSockets[userData.name]
    }
   
    socket.leave(userData._id);
    if(CurrentOnline['local']){
    let inde = CurrentOnline['local'].indexOf(socket.user)

    if(inde > 0){
      CurrentOnline['local'].splice(inde,1)
      }
    }
    broadcastPresence()
   
  
  
   
  });

  




});


connectToServers()