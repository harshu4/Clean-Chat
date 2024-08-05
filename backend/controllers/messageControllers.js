const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const WebSocket = require('ws');
let connections = new Map();
let Activeconnections = new Map();
//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { enccontent,encmecontent, chatId,name,content } = req.body;

  if (!enccontent || !encmecontent || !chatId || !name) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    enccontent: enccontent,
    encmecontent:encmecontent,
    content:content,
    chat: chatId,

  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    if (name.includes('@')) {
      const [username, server] = name.split('@');
      const message = {
        tag: 'message',
        from: req.user.name+"@"+process.env.SERVER_NAME,
        to: name,
        info: enccontent,
      };
     
      console.log(Activeconnections.get(server))
      Activeconnections.get(server).send(JSON.stringify(message))
      
  } else if (name == "Public"){
    const message = {
      tag: 'message',
      from: req.user.name+"@"+process.env.SERVER_NAME,
      to: "public",
      info: content,
    };
     Activeconnections.forEach(client => {

    if (client.readyState === WebSocket.OPEN) {
      console.log("to ip ", client.ip)
      console.log("send to this client")
      client.send(JSON.stringify(message));
    }
  });
  }
     
    res.json(message);
  } catch (error) {
    res.status(400);
    console.log(error)
    throw new Error(error.message);
  }
});



async function handleMessageExternal(messageData,pubKey) {
  const { from, to, info } = messageData;
let chat;
  // Step 4: Check if sender (from) exists in the database
  let sender = await User.findOne({ name: from });
  if (!sender) {
    // If sender does not exist, create a new User
    sender = await User.create({ name: from, pubkey: pubKey, email: from, password: "defaultPassword", salt: "defaultSalt",external:true});
  }
  if (to == "public") {
    chat = await Chat.findOne({
      chatName:"Public"
    })


  }else {
  // Step 5: Check if recipient (to) exists in the database
  let recipient = await User.findOne({ name: to.split("@")[0] });
  if (!recipient) {
    // Handle scenario where recipient doesn't exist
    console.log(`Recipient with name ${to} not found.`);
    return;
  }

  // Step 6: Check if a chat exists between sender and recipient
  chat = await Chat.findOne({
    users: { $all: [sender._id, recipient._id] },
  });

  // Step 7: If no chat exists, create a new chat
  if (!chat) {
    chat = await Chat.create({ users: [sender._id, recipient._id] });
  }
}

  // Step 8: Create a Message document
  let message = await Message.create({
    sender: sender._id,
    enccontent: info,
    encmecontent: "", // Assuming encmecontent is the same as enccontent
    content : info,
    chat: chat._id,
    readBy: [],
  });

  // Step 9: Update the chat's latest message reference
  chat.latestMessage = message._id;
  await chat.save();

  console.log('Message handled:', message);
  message = await message.populate("sender", "name pic").execPopulate();
  message = await message.populate("chat").execPopulate();
  message = await User.populate(message, {
    path: "chat.users",
    select: "name pic email",
  });

  await Chat.findByIdAndUpdate(chat._id, { latestMessage: message });

  return message
}



module.exports = { allMessages, sendMessage,handleMessageExternal,connections,Activeconnections};
