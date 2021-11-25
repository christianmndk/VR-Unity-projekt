/*
Skriv denne kommando i terminalen:
node bridge.js
*/

// input til at sende tekst beskeder til Unity VR
let textInput;

let unityHostInputField;

let connectedStatus = 0;

let resultPre;

let containerSection;

let socket;

let tegnResived = [];

//Vi sætter alle konfigurationsoplysninger i et array 
//Lytter (fx på beskeder fra wekinator) på port 11000
//Sender beskeder til Unity på port 12000
//Sender beskeder til en evt låsemekanisme på port 10330
//Sender beskeder til en evt wekinator på port 6448
//IP'erne kan være lokale eller over netværk - doesn't matter

let bridgeConfig = {
	local: {
		//Her sætter vi scriptet til at modtage OSC på localhost:11000
		port: 6448,
		host: '127.0.0.1'
	},
	remotes: [{
			//Unity modtager OSC på DEN IP ADRESSE DEN SIGER: 12000
			name: "unity",
			port: 12000,
			host: '192.168.50.145' // Tilrettes efter hvad Unity-app'en fortæller
		},
		{
			//HVIS i har et processing skitse tilknyttet en ARDUINO skal I programmere den til at modtage OSC på port 10330
			name: "arduino",
			port: 10330,
			host: '192.168.8.105' // Tilrettes efter adressen på Arduinoens adgang til netværket
		},
		{
			//HVIS i har et processing skitse tilknyttet WEKINATOR vil den modtage OSC på port 6448
			name: "wekinator",
			port: 11000,
			host: '192.168.8.105' // Tilrettes efter adressen på Wekinatorens adgang til netværket
		}
	]
};

function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

function setup() {
	setupOsc(); // Begynd at lytte efter OSC - nederst i scriptet her
    
	// Page container

	containerSection = createElement("section", "").addClass("container");

	// Unity adresse
	createElement("h3", "Unity netværksadresse")
		.parent(containerSection);

	//Den løber igennem konfigurations JSON og sætter det på serveren
	let unityConfig = bridgeConfig.remotes.filter(r => r.name === "unity")[0];
	unityHostInputField = createElement("p", unityConfig.host + ":" + unityConfig.port)
		.parent(containerSection);


	// Arduino adresse
	/*
	createElement("h3", "Arduino netværksadresse")
		.parent(containerSection);

	let arduinoConfig = bridgeConfig.remotes.filter(r => r.name === "arduino")[0];
	unityHostInputField = createElement("p", arduinoConfig.host + ":" + arduinoConfig.port)
		.parent(containerSection);*/



	createElement("h3", "Højest mulige tal").parent(containerSection);

	nuInput = createInput()
		.parent(containerSection)
		.changed((e) => {
			console.log(nuInput.value());
			if(nuInput.value()=="87")
			{
				sendOsc("/nu", 1);
				console.log("rigtie nummer");
			}
			else
				console.log("ikke rigtig nummer");
		});



	
	// Seneste OSC input

	createElement("h3", "tegn & tal fra labyreinten")
		.parent(containerSection);

	resultPre = createElement('pre', ' ')
		.parent(containerSection); // a div for the Hue hub's responses
}

/*
  Nedenstående er OSC funktioner. 
*/

function receiveOsc(address, value) {
	let resived = address.split('/');
	if (resived[1] === "re") {
		console.log("you got a message");
		console.log(resived[1]);
		console.log(value);
		tegnResived.push(value)
	}
	console.log("tegn resived "+ tegnResived.join(' '))
	resultPre.html(tegnResived);
	//resultPre.html(address + "   " + value + '\n' + resultPre.html());
}

function logOscInput(string) {
	resultPre.html(address + "   " + value + '\n' + resultPre.html());
}

function sendOsc(address, value) {
	console.log(`sending message: ${address}: ${value}`);
	socket.emit('message', [address].concat(value));
	//console.log(socket);
}

function setupOsc() {
	console.log("setup OSC")
	socket = io.connect('http://127.0.0.1:8081', {
		port: 6448,
		rememberTransport: false
	});
	socket.on('connect', function () {
		socket.emit('config', bridgeConfig);
	});
	socket.on('connected', function (msg) {
		connectedStatus = msg;
		console.log("socket says we're conncted to osc", msg);
	});
	socket.on('message', function (msg) {
		console.log("client socket got", msg);
		if (msg[0] == '#bundle') {
			for (var i = 2; i < msg.length; i++) {
				receiveOsc(msg[i][0], msg[i].splice(1));
			}
		} else {
			receiveOsc(msg[0], msg.splice(1));
		}
	});

	console.log('test')
	//console.log(socket)
}