
const webSocket = new WebSocket("ws://192.168.0.13:3000")

// Websoket Open to comunication to the server
webSocket.addEventListener ('open', function(event) {
    console.log ('Connected to WS Server')
})

// Listen for message from Websocket Server

webSocket.addEventListener ('message', function (event){
    console.log ('Message from Signaling Server: ', event.data)
    data = JSON.parse(event.data);
    console.log ('json funcion:',data);
    switch (data.type) {
        
              
        case "video-answer":
            
            handleVideoAnswerMsg (data);
        break;
        case "new-ice-candidate":
            
            handleNewICECandidateMsg(msg);
        break;
    }
    
})



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
    data.username = username; // se alamacena el valor de username "carlos" en el objeto creado
    console.log (data); // {type: 'store_user', username: 'Carlos'}
    console.log (JSON.stringify(data));
    webSocket.send(JSON.stringify(data));  // lo coloca como texto todo el objeto
    
}

let pc1
let targetUsername
let localMediaStream
let remoteMediaStream
async function startCall() {

    /* ------------------------------------ I N V I T E -------------------------------------------------- */

    /* ++++++++CREAR PEER A CONNECTION++++++++++ 
       WebRTC uses the RTCPeerConnection API
       to set up a connection to stream video between WebRTC clients, known as peers. */
    
    pc1 = new RTCPeerConnection(servers);
    console.log ('Se crea el Peer Connection para PC1: ');
    console.log ('Informacion Peer A Connection Sin Media:', pc1);
    console.log ('Informacion Local Media Stream:', localMediaStream);
       
    pc1.onicecandidate = handleICECandidateEvent;
    pc1.ontrack = handleTrackEvent;
    pc1.onnegotiationneeded = handleNegotiationNeededEvent;
    
    remoteMediaStream = new MediaStream ();

    pc1.ontrack = event => {
        event.streams[0].getTracks().forEach(track=> {
            remoteMediaStream.addTrack(track);
        })
    };
    
    console.log ('Informacion Local Peer B Remote Stream:', remoteMediaStream);
    document.getElementById("remote-video").srcObject = remoteMediaStream;
 

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

    localMediaStream.getTracks().forEach(track => pc1.addTrack(track, localMediaStream));
    console.log ('Informacion Peer Connection PC1: Se Inserta Local Media Stream:', pc1);

    /* ------------------------------------ FIN INVITE -------------------------------------------------- */
    
    
    /* 
    
    The Browser will deliver a negotiationneeded event 
    to the RTCPeerConnection to indicate that it's ready to begin negotiation with the other peer. 
    Here's our code for handling the function ---> negotiationneeded event.
    
    Where function permit create SDP with a Call createOffer() inside of RTCSessionDescription object. 
    This session description is set as the local description using setLocalDescription() 
    and is then sent over our signaling channel to the receiving side Peer B. 

    */

    function sendDataSignalingServer (data) {
        //data.name = username // se alamacena el valor de username "carlos" en el objeto creado
        console.log (data); // {type: 'video-offer', name: 'Carlos'}
        webSocket.send(JSON.stringify(data));
        
    }
    

    function handleICECandidateEvent(event) {
        if (event.candidate) {
            console.log ('valores de ICE Candidate entrantes: ',event);
          sendDataSignalingServer({
            type: "new-ice-candidate",
            target: targetUsername,
            candidate: event.candidate
          });
        }
    }

    
    async function handleNegotiationNeededEvent() {

        const offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
          };

          
        
        const offer = await pc1.createOffer(offerOptions);
        await pc1.setLocalDescription(offer);
        console.log ('Se muestra el Offer SDP Peer A:', offer);
        console.log ('Se inserta el offer SDP y se ajusta a setLocalDescription en LocalPeerConnection A: ',pc1);

        sendDataSignalingServer ({

            name: username,
            target: targetUsername,
            type: "video-offer", // es un objeto y se aplica la funcion sendData
            sdp: pc1.localDescription
        })
    
    }

    
}

function handleTrackEvent(event) {
    document.getElementById("remote-video").srcObject = event.streams[0];
    //document.getElementById("hangup-button").disabled = false;
}

function handleVideoAnswerMsg (data) {

    console.log("Call recipient has accepted our call");
    console.log ('data',data);
    console.log ('Se inserta el answer en el pc1 antes: ',pc1);

    // Configure the remote description, which is the SDP payload
    // in our "video-answer" message.
    des = new RTCSessionDescription (data.sdp);
    
    pc1.setRemoteDescription(des);
    console.log ('Se inserta el answer en el pc1 final: ',pc1);
    pc1.addEventListener = handleTrackEvent;

/* ++++++++++++++++++++++++++++D A T A +++++++++++++++++ C H A N N E L ++++++++++++++++++++ */    
    console.log ('Activacion de Data Channel... Web RTC: ',pc1);
    const datachannelOptions = {
        ordered: false,
        maxPacketLifeTime: 3000, //in milisegundos
    };

    const dataChannel = pc1.createDataChannel ("myLabel", datachannelOptions);

    dataChannel.onerror = (error) => {
        console.log("Data Channel Error: ",error);
    };

    dataChannel.onmessage = (event) => {
        console.log("Got data Channel Message: ", event.data);
    };

    dataChannel.onopen = () => {
        dataChannel.send ("Hello World:... ");
    };

    dataChannel.onclose = () => {
        console.log ("The Data Channel is Closed");
    };


}

function handleNewICECandidateMsg(msg) {
    var candidate = new RTCIceCandidate(msg.candidate);
  
    pc1.addIceCandidate(candidate)
      .catch(reportError);
}



/* Our chat server uses the WebSocket API to send information as JSON strings 
between each client and the server. The server supports several message 
types to handle tasks, such as registering new users, setting usernames, 
and sending public chat messages. */
