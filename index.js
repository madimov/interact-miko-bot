'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const nodemailer = require('nodemailer'); 

// Create express app.
const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Set up routes.

app.get('/', function(req, res) {
	res.send("Hi I am a chatbot")
});

// Set up webhook, to be used by Facebook Messenger.

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "interactmikobot") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});

// Handle messages.
app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging;
	// Iterate through received messages.
	for (let i = 0; i < messaging_events.length; i++) {
		let event = messaging_events[i];
		let sender = event.sender.id;
		// If text message, decide on a response.
		if (event.message && event.message.text) {
			let text = event.message.text;
			decideMessage(sender, text);
		}
	}
	res.sendStatus(200);
	// Request was successful.
});

// Set up emailing capability.
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'interactmikobot@gmail.com',
		pass: 'q22@j5!hs!-NAzUx'
	}
});

let mailOptions = {
	from: 'interactmikobot@gmail.com',
	to: 'michael@interact.io, patrick@interact.io',
	subject: '', // To be updated with user name.
	text: ''     // To be updated with user data.
};

// Initialize token, chatbot state, and user data.
let token = "EAAJDvNLSAo8BAIRAZAYskNrgWoikPnAMhWVB0ZA8hvURXNCiQIzoY6EdTwag3lZA\
uNZBXWGYnxq4x1EM5EgjtZBRPZBUhwYvwZCfFhGo1HZAtaITd91m1TfAq5JOAiBTQuUvC1dptgfJxa\
9yuCtkjFflsLMwoCWjnCZAb7Kj5ai7V9wZDZD"; // for FB Messenger app authentication


let idle = true; // Set chatbot state to idle, open to new messages.

let personInfo = {
	"first name":"",
	"last name":"",
	"email":"",
	"age":"",
	"gender":"",
	"city":"",
	"country":""
};

// Choose message to send.
function decideMessage(sender, text1) {
	let text = text1.toLowerCase();

	if (idle) {
		let introMessage = "Hi, I'd like to collect some basic information." + 
		"\nWhat is your " + Object.keys(personInfo)[0] + "?";
		// Introduce bot, ask for first piece of user data.
		sendText(sender, introMessage);
		idle = false; // No longer idle; engaged in data collection.
		return; // Break and wait for response.
	} else if (existsEmptyKey()) {
		// If engaged in data collection and there is missing data, get data.
		fillNextEmptyKey(sender, text);
		if (!existsEmptyKey()) {
			// If no more data to collect, end conversation and clean up.
			sendText(sender, "Thank you for the information. Goodbye!");
			emailData();
			clearInfo(); // Make space for next user data.
			idle = true; // Await a new conversation.
		}
	}
}

function existsEmptyKey() {
	return ((typeof getNextEmptyKey() !== "undefined" &&
	 getNextEmptyKey() !== null));
}

function getNextEmptyKey() {
	for (let key in personInfo) {
		if (personInfo[key] === "") {
			return key;
		}
	}
}

function fillNextEmptyKey(sender, text) {
	let key = getNextEmptyKey();
	getValue(sender, text, key);
}

function getValue(sender, text, key) {
	if (isValid(text, key)) {
		personInfo[key] = text; // Update user data with validated information.
		if (existsEmptyKey()) {
			// If more data to collect, ask for next missing piece of info.
			let nextKey = getNextEmptyKey();
			sendText(sender, getQuestion(nextKey, "valid"));
		}
	} else {
		sendText(sender, getQuestion(key, "invalid")); // Repeat question.
	}
}

function isValid(text, key) {
	// validation criteria are somewhat loose due to range of valid responses.
	if ((key === "first name") || (key === "last name")) {
		return ((text.length < 85) && (/^[a-zA-Z]+$/.test(text)));
	} else if (key === "email") {
		return ((text.length < 254) && (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)));
	} else if (key === "age") {
		return ((text.length < 4) && (Number(text) > 0) && (Number(text) < 125));
	} else if (key === "gender") {
		return ((text === "female") || (text === "male") || (text === "other"));
	} else if ((key === "city") || (key === "country")) {
		return ((text.length < 85));
	} else {
		return false;
	}
}

function getQuestion(key, validity) {
	let question = "";
	if (validity === "invalid") { 
		question = "I can't recognize this " + key + ". Please try again. ";
	}
	question += "What is your " + key + "?";
	// Guide user to valid format.
	if (key === "age") {
		question += " Please use digits.";
	} else if (key === "gender") {
		question += " Please use female/male/other.";
	}
	return question;
}

function emailData() {
	mailOptions.subject = "Information about " + personInfo["first name"] + 
	" " + personInfo["last name"]; // Email subject is user name.
	mailOptions.text = JSON.stringify(personInfo); // Email text is user data.

	transporter.sendMail(mailOptions, function(error, info){ // Send email.
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
}

function clearInfo() {
	for (let key in personInfo) {
		personInfo[key] = "";
	}
}

function sendText(sender, text) {
	let messageData = {text: text};
	sendRequest(sender, messageData);
}

function sendRequest(sender, messageData) {
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs: {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message : messageData
		}
	}, function(error, response, body) {
		if (error) {
			console.log("sending error");
		} else if (response.body.error) {
			console.log("response body error");
		}
	});
}

app.listen(app.get('port'), function() {
	console.log("running: port");
})