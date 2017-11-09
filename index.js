'use strict'

// required modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const nodemailer = require('nodemailer'); 

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

// set up emailing capability
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'interactmikobot@gmail.com',
		pass: 'q22@j5!hs!-NAzUx'
	}
});

let mailOptions = {
	from: 'interactmikobot@gmail.com',
	to: 'miko-wan@hotmail.com',
	subject: '',
	text: ''
};

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

function getValue(sender, text, key) {
	if (isValid(text, key)) {
		personInfo[key] = text;
		console.log("personInfo['", key, "']", " has been set to ", text);
		if (existsEmptyKey()) {
			let nextKey = getNextEmptyKey();
			sendText(sender, getQuestion(nextKey, "valid"));
		}
	} else {
		console.log(text, " is NOT a valid ", key, "... asking again for ", key, ".");
		sendText(sender, getQuestion(key, "invalid"));
	}
}

function isValid(text, key) {
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
	if (key === "age") {
		question += " Please use digits.";
	} else if (key === "gender") {
		question += " Please use female/male/other.";
	}
	return question;
}

function emailData() {
	mailOptions.subject = "Information about " + personInfo["first name"] + 
	" " + personInfo["last name"];
	mailOptions.text = JSON.stringify(personInfo);

	transporter.sendMail(mailOptions, function(error, info){
		if (error) {
			console.log(error);
		} else {
			console.log('Email sent: ' + info.response);
		}
	});
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