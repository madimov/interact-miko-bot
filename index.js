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

// choose message to send

// set up text to be send

// send request

// set up app listening
app.listen(app.get('port'), function() {
	console.log("running: port");
})