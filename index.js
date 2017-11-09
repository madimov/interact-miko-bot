'use strict'

// required modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

// create express app
const app = express();

// set app port
app.set('port', (process.env.PORT || 5000));

// set up bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// ROUTES

app.get('/', function(req, res) {
	res.send("Hi I am a chatbot")
});

// Facebook

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "interactmikobot") {
		res.send(req.query['hub.challenge']);
	}
	res.send("Wrong token");
});

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging;
	
	for (let i = 0; i < messaging_events.length; i++) {
		let event = messaging_events[i];
		let sender = event.sender.id;

		if (event.message && event.message.text) {
			let text = event.message.text;
			decideMessage(sender, text);
		}
	}
	res.sendStatus(200);
});

// initialize values
let token = "EAAJDvNLSAo8BAIRAZAYskNrgWoikPnAMhWVB0ZA8hvURXNCiQIzoY6EdTwag3lZA\
uNZBXWGYnxq4x1EM5EgjtZBRPZBUhwYvwZCfFhGo1HZAtaITd91m1TfAq5JOAiBTQuUvC1dptgfJxa\
9yuCtkjFflsLMwoCWjnCZAb7Kj5ai7V9wZDZD";

let idle = true;

let personInfo = {
	"first name":"",
	"last name":"",
	"email":"",
	"age":"",
	"gender":"",
	"city":"",
	"country":""
};

// choose message to send
function decideMessage(sender, text1) {
	let text = text1.toLowerCase();
	console.log("idle: ", idle);
	console.log("text: ", text);

	if (idle) {
		let introMessage = "Hi, I'd like to collect some basic information." + 
		"\nWhat is your " + Object.keys(personInfo)[0] + "?";
		sendText(sender, introMessage);
		idle = false;
		return;
	} else if (existsEmptyKey()) {
		console.log("existsEmptyKey");
		fillNextEmptyKey(sender, text);
		if (!existsEmptyKey()) {
			sendText(sender, "Thank you for the information. Goodbye!");
			emailData();
			clearInfo();
			idle = true;
		}
	}
}

function existsEmptyKey() {
	return ((typeof getNextEmptyKey() !== "undefined" && getNextEmptyKey() !== null));
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
	console.log("getting next empty key: ", key);
	getValue(sender, text, key);
}

// set up text to be send
function sendText(sender, text) {
	let messageData = {text: text};
	sendRequest(sender, messageData);
}

// send request
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

// set up app listening
app.listen(app.get('port'), function() {
	console.log("running: port");
})