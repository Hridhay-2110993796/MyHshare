var dc, pc = new RTCPeerConnection();
pc.onaddstream = e => v2.srcObject = e.stream;  /*It is executed when an media event is recieved*/
pc.ondatachannel = e => dcInit(dc = e.channel);/*Called when datachannel has been added to connection between peers.*/
pc.oniceconnectionstatechange = e => log(pc.iceConnectionState);    /*Restarts the Connection when the event fails*/
var haveGum = navigator.mediaDevices.getUserMedia({video:true, audio:true})
  .then(stream => pc.addStream(v1.srcObject = stream)).catch(log);

function dcInit() {
  dc.onopen = () => {
		log("Chat!");
	document.getElementById("conn").remove();
	}
  dc.onmessage = e => {
		process(JSON.parse(e.data));  /* Helps in exchanging data to/from web server.*/
  }
}

function process(m) {          /* function created to implement different functions*/
	switch(m.type) {
		case 'chat':
			log(m.val);
			break;
		case 'file':
			saveFile(m.name, m.val);
			break;
		default:
			console.log("unknown message")
			console.log(m)
	}
}

function createOffer() {                    /*Function to create the link*/
  button.disabled = true;
  dcInit(dc = pc.createDataChannel("chat"));  /*Created data channel is connected to the peer*/
  haveGum.then(() => pc.createOffer()).then(d => pc.setLocalDescription(d))
    .catch(log);         /*Link is created for the connection to be established*/
  pc.onicecandidate = e => {
    if (e.candidate) return;
    offer.value = bytesToBase64(pako.gzip(pc.localDescription.sdp));   /*Created offer is encoded*/
    offer.select();
    answer.placeholder = "Paste answer here";
  };
};

offer.onkeypress = e => {
  if (!enterPressed(e) || pc.signalingState != "stable") return;  /*Connected is created when enter is pressed*/
  button.disabled = offer.disabled = true;
  var desc = new RTCSessionDescription({ type:"offer", sdp: pako.ungzip(base64ToBytes(offer.value), {to: 'string'}) });  /*Creates a string of the offer*/
  pc.setRemoteDescription(desc)             /*Gives the session description like file format*/
    .then(() => pc.createAnswer()).then(d => pc.setLocalDescription(d))
    .catch(log);
  pc.onicecandidate = e => {         /*Generates the Answer link*/
    if (e.candidate) return;
    answer.focus();
    answer.value = bytesToBase64(pako.gzip(pc.localDescription.sdp));  /*Encoded*/
    answer.select();
  };
};

answer.onkeypress = e => {
  if (!enterPressed(e) || pc.signalingState != "have-local-offer") return;
  answer.disabled = true;
  var desc = new RTCSessionDescription({ type:"answer", sdp: pako.ungzip(base64ToBytes(answer.value), {to: 'string'}) });  /*Creates a string of the answer*/
  pc.setRemoteDescription(desc).catch(log);   /*Connection is made with the remote*/
	document.getElementById("conn").remove();
};

chat.onkeypress = e => {
  if (!enterPressed(e)) return;
  dc.send(JSON.stringify({type: 'chat', val: chat.value})); /*Chat value is sent using the enter button*/
  log(chat.value);
  chat.value = "";
};

file.onchange = e => {
	file = e.target.files[0];     /*The selected file is sent using sendFile()*/
    var r = new FileReader();
    r.onload = function(e) {
      sendFile(e.target.result, file.name);
    }
    r.readAsText(file);
}

vidtoggle.onchange = e => {
	if (vidtoggle.checked) {
		var haveGum = navigator.mediaDevices.getUserMedia({video:true, audio:true})   /*Video is catched at the remote end*/
  .then(stream => pc.addStream(v1.srcObject = stream)).catch(log);
	} else {
		v1.srcObject = null;
		pc.getSenders().forEach(i => {
			pc.removeTrack(i);
		});
	}
}

function sendFile(file, name) {
    dc.send(JSON.stringify({type: "file", name: name, val: base64encode(file)}));  /*File is sent using the .send() function*/
}

function saveFile(name, cont) {
	var d = document.createElement("div");
	d.className = "smoldialog";
	d.innerText = "You have received a file:\n" + name + "\nSAVE?";    /*Text written in dialog box*/
	let yesbutt = document.createElement("button");
	yesbutt.innerText = "Yes";    /*Button*/
	yesbutt.onclick = e => {
		d.remove();
		var blob = new Blob([base64decode(cont)], {         /*Blob is file-like object of immutable raw data*/
			type: "application/octet-stream"
		});
		saveAs(blob, name);
	}
	let nobutt = document.createElement("button");
	nobutt.innerText = "No";
	nobutt.onclick = e => {
		d.remove();
	}
	d.append(yesbutt, nobutt);
	document.body.append(d);
}

var enterPressed = e => e.keyCode == 13;
var log = msg => document.getElementById("logbox").innerText += msg + "\n\n";
