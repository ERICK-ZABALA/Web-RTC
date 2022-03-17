
const webSocket = new WebSocket("ws://127.0.0.1:3000")

// Websoket Open to comunication to the server
webSocket.addEventListener ('open', function(event) {
    console.log ('Connected to WS Server: ',event)
})

// Listen for message from Websocket Server

webSocket.addEventListener ('message', function (e) {
    
    data = JSON.parse(e.data);
    console.log ('json function:',data);
    
    switch (data.type) {
                     
        case "video-offer":
            handleVideoOfferMsg(data);
        break;

        case "new-ice-candidate":
            handleNewICECandidateMsg(data);
        break;        
    }       

   //console.log ('Message from Signaling Server: ', event);
   //console.log(event.data);
        

});






/*const webSocket = new WebSocket("ws://127.0.0.1:3000")

webSocket.onmessage = (event) => {

    handleSignallingData(JSON.parse(event.data))
}
*/

//const data = null;


const servers = {

    iceServers: [
        {
            "urls": ["stun:stun2.l.google.com:19302"]
                                                    
        }
    ]
}

let username

function sendUsername() {

    username = document.getElementById("username-input").value
    // se captura el valor de input de html con document.getElementById() y se lo almacena en una variable username
    console.log (username) // se muestra el valor en consola "Carlos"
    sendData ({

        type: "store_user" // es un objeto y se aplica la funcion sendData

    }) 
}

function sendData(data) {
    data.username = username // se alamacena el valor de username "carlos" en el objeto creado
    console.log (data) // {type: 'store_user', username: 'Carlos'}
    webSocket.send(JSON.stringify(data))
}




function sendDataSignalingServer (data) {
    //data.name = username // se alamacena el valor de username "carlos" en el objeto creado
    console.log (data); // {type: 'video-offer', name: 'Carlos'}
    webSocket.send(JSON.stringify(data));
    
}
let data
let targetUsername
let localMediaStream
let remoteMediaStream

async function handleVideoOfferMsg(msg) {

    /* ------------------------------------ O F F E R   M E S S A G E -------------------------------------------------- */
    targetUsername = data.name;
    

    /* ++++++++CREAR PEER A CONNECTION++++++++++ 
       WebRTC uses the RTCPeerConnection API
       to set up a connection to stream video between WebRTC clients, known as peers. */
    
    pc2 = new RTCPeerConnection(servers);
    console.log ('Informacion Peer B Connection Sin Media:', pc2);
    console.log ('Informacion Local Peer B Media Stream:', localMediaStream);
    //pc2.addTransceiver('video',{direction:'recvonly'})   
    
    pc2.onicecandidate = handleICECandidateEvent;
    
    //remoteMediaStream = new MediaStream ();

    pc2.ontrack = handleTrackEvent;

    var desc = new RTCSessionDescription (data.sdp);
    pc2.setRemoteDescription(desc);
    
    console.log ('Peer Connection with Set Desc:', pc2);
        
    document.getElementById("video-call-div").style.display= "inline"; // ajusta el estilo CSS display a inline permitiendo que se muestra en una linea las imagenes
                                                                      // remota y local

    const constraints = {
        'video': true,
        'audio': true
    };

    /*Pide al usuario permiso para usar un dispositivo multimedia como una cámara o micrófono. 
    Si el usuario concede este permiso, el successCallback es invocado en la aplicación 
    llamada con un objeto: MediaStream {id: '6nEEsajI0bE3pnvZEwdF7TytuHY212iAktYe'...]
    viene a ser el Stream (audio y video) 
    
    *MediaStream (promise)
    The MediaStream interface represents a stream of media content.
    A stream consists of several tracks, such as video or audio tracks. 

    El método then() retorna una Promesa = MediaStream.
    La promesa devuelta por catch() es rechazada lanza un error.

    */

       
    await navigator.mediaDevices.getUserMedia(constraints).then(promiseMediaStream).catch(rejectMediaStream);
    
    function promiseMediaStream(media) {

        document.getElementById("local-video").srcObject = media; // el video stream se posiciona en la etiqueta local-video
        console.log (media); //PORQUE MUESTRA EN LA WEB VIDEO SI ES UN OBJETO???
        localMediaStream = media;   
        

    }

    function rejectMediaStream(error) {
        console.log ('navigator.mediaDevices.getUserMedia error: ',error);
    }
   
    // LA MEDIA SE INSERTA AL RTCP PEER CONNECTION ----->  Promise fulfilled: add the local stream's tracks by calling

    localMediaStream.getTracks().forEach(track => pc2.addTrack(track, localMediaStream));
    console.log ('Informacion Peer B Connection: Se Inserta Local Media Stream:', pc2);
    
    pc2.createAnswer().then(function(answer) {
        return pc2.setLocalDescription(answer);
      })
      .then(function() {

        
        sendDataSignalingServer ({

            name: username,
            target: targetUsername,
            type: "video-answer", // es un objeto y se aplica la funcion sendData
            sdp:  pc2.localDescription,
        })
      })
      .catch();


}    /* ------------------------------------ FIN INVITE -------------------------------------------------- */


function handleICECandidateEvent(event) {
    if (event.candidate) {
      sendDataSignalingServer({
        type: "new-ice-candidate",
        target: targetUsername,
        candidate: event.candidate
      });
    }
}

function handleNewICECandidateMsg(msg) {
    var candidate = new RTCIceCandidate(msg.candidate);
  
    pc2.addIceCandidate(candidate)
      .catch(reportError);
}



function handleTrackEvent(event) {
    document.getElementById("remote-video").srcObject = event.streams[0];
    //document.getElementById("hangup-button").disabled = false;

    
}




