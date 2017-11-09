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

// choose message to send

// set up text to be send

// send request

// set up app listening
app.listen(app.get('port'), function() {
	console.log("running: port");
})