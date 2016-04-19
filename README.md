# osn-rtm-server
PoC for a real time messaging (RTM) API server using socket.io for integrating 3rd party chatbots. 
This is for integration with Oracle Social Network (OSN).

- This node app runs as the RTM server that bot clients can connect to using websockets. 

- Client bot developers need to register their bot using the /registerBot end point. 
  A 16 char bot token is generated in the registration page that should be used by the bots to communicate with this RTM API.

- Once registered, a POST request on /osn from the bot client with body containing the token, conversation ID and the message 
  will create a chat in the OSN server as the bot. (The Bot user needs to be seeded manually in OSN first). 
  The socket created when the POST req was received by the server is stored in memory for the purpose of this PoC.

- From OSN server, a POST req on /bot end point along with the body containing the bot user name and the originating OSN server URL 
  is used to look up the bot token. Using the bot token, the corresponding socket object is retrieved on which the 'osnMessage' event 
  is emitted.
  

