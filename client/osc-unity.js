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


//Vi sætter alle konfigurationsoplysninger i et array 
//Lytter (fx på beskeder fra wekinator) på port 11000
//Sender beskeder til Unity på port 12000
//Sender beskeder til en evt låsemekanisme på port 10330
//Sender beskeder til en evt wekinator på port 6448
//IP'erne kan være lokale eller over netværk - doesn't matter

let bridgeConfig = {
	local: {
		//Her sætter vi scriptet til at modtage OSC på localhost:11000
		port: 11000,
		host: '127.0.0.1'
	},
	remotes: [{
			//Unity modtager OSC på DEN IP ADRESSE DEN SIGER: 12000
			name: "unity",
			port: 12000,
			host: '192.168.50.80' // Tilrettes efter hvad Unity-app'en fortæller
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
			port: 6448,
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

	// Tekst besked

	createElement("h3", "Tekstbesked til spiller")
		.parent(containerSection);

	textInput = createInput()
		.parent(containerSection)
		.changed((e) => {
			console.log(textInput.value());
			sendOsc("/text", textInput.value());
		});

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

	createElement("h3", "Rigtige ord").parent(containerSection);

	woInput = createInput()
		.parent(containerSection)
		.changed((e) => {
		console.log(woInput.value().toLowerCase());
		if(woInput.value().toLowerCase()=="nut")
		{
			sendOsc("/wu", 1);
			console.log("rigtige ord");
		}
		else
			console.log("ikke rigtige ord");
	});

	
	// Seneste OSC input

	createElement("h3", "Seneste OSC Input")
		.parent(containerSection);

	resultPre = createElement('pre', 'Intet input endnu')
		.parent(containerSection); // a div for the Hue hub's responses
}

/*
  Nedenstående er OSC funktioner. 
*/

function receiveOsc(address, value) {
	if (address.split('/')[1] === "wek") {
		// besked fra Wekinator
	}

	resultPre.html(address + "   " + value + '\n' + resultPre.html());

	// Her løber vi alle slidere igennem
	listeningSliders.map(s => {
		// Hvis adressen svarer til sliderens adresse (fx wek/outputs)
		if (address === s.address) {
			// Hvis der er en værdi i value arrayet
			if (value[s.index]) {

				if (s.parseValue) {
					value[s.index] = s.parseValue(value[s.index]);
				}

				// let sliderValue = map(value[s.index], 0.0, 1.0, s.slider.elt.min, s.slider.elt.max);
				let sliderValue = map(value[s.index], 0.0, 1.0, -18000, 18000);
				console.log("slider " + s.index + " got value", value[s.index] + " map returns " + sliderValue);
				s.slider.elt.value = sliderValue;
				var event = new Event('input', {
					'bubbles': true,
					'cancelable': true
				});

				s.slider.elt.dispatchEvent(event);

			}
		}
	});

}

function logOscInput(string) {
	resultPre.html(address + "   " + value + '\n' + resultPre.html());
}

function sendOsc(address, value) {
	console.log(`sending message: ${address}: ${value}`);
	socket.emit('message', [address].concat(value));
	console.log(socket);
}

function setupOsc() {// Det betyder at i den mappe der hedder "/client" der ligger de filer som browsere må se

	console.log("setup OSC")
	socket = io.connect('http://127.0.0.1:8081', {
		port: 8081,
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
		console.log("I DONT EVEN WANNA KNOW")
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