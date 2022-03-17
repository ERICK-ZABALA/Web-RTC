const WebSocket = require('ws');
const wss = new WebSocket.Server({ port:3000 }); // 
let users = []


//const express = require('express')
//const app = express()
//const server = require('http').createServer(app);

//app.get('/', function (req, res) {
//  res.send('Hello World')
//})

//server.listen(3000, () => console.log('Listening on port: 3000'));

wss.on('listening', function () {
    console.log('Server listening port: 3000...')

});

wss.on('connection', ws => {
  console.log ('Peer Connected: '); // escucha el servidor y envia un mensaje a consola
  //ws.send('Welcome New Peer: '); // envia un mensaje al cliente 


  ws.on ('message', message => {
    let data;
    try 
        {
          data = JSON.parse(message);
          console.log ('json:',data);

          wss.clients.forEach(function each(client){
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              
              
              const user = findUser(data.username);
              console.log('user: ' + user);

              switch(data.type) {
                
                case 'store_user':
                  console.log('Currently Users : ',users);        
                if (user != null) {
                    return
                
                  }
                  
                  const newUser = {
                    conn: 'connection',
                    username: data.username
                  }

                  users.push(newUser)
                  console.log(newUser.username)
                  break

                 case 'video-offer':

                  data = JSON.stringify (data);
                  console.log('text de data: ',data);
                  client.send(data);
                  break
                 
                 case 'video-answer': 
                 data = JSON.stringify (data);
                 console.log('text de data: ',data);
                 client.send(data);
                 break
              }
              
              

            }
      
          })
      

        } catch (error) {

          console.log (`INVALID MESSAGE: ${error.message}`);
          return;
        }
  
  });  
  
});


/* file: package.json
"start": "node app.js" ----> ejecuta de forma automatica el programa bajo comando npm start  */
function findUser(username) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].username == username){
            return users[i];}
    }   
}