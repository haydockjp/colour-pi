// Dependancies & Constants
const  https = require('https')
, Cylon = require("cylon")
, fs = require('fs')
, express = require('express')
, logger = require('morgan')
, helmet = require('helmet')
, https_options = require('./https_options')
, ONE_YEAR = 31536000000
;

// Environment variable that can overide settings
// COLOUR_PI_PORT can set the website port - default 443
const httpsPort = parseInt(process.env.COLOUR_PI_PORT, 10) || 443; 
// COLOUR_PI_WSS_PORT can set the socket.io websocket port - default 1443
const wssPort = parseInt(process.env.COLOUR_PI_WSS_PORT, 10) || 1443;

// COLOUR_PI_PIN_BLUE can set the RPi pin for the Blue LED control - default 16
const pinBlue = parseInt(process.env.COLOUR_PI_PIN_BLUE, 10) || 16;
// COLOUR_PI_PIN_RED can set the RPi pin for the Red LED control - default 18
const pinRed = parseInt(process.env.COLOUR_PI_PIN_RED, 10) || 18;
// COLOUR_PI_PIN_GREEN can set the RPi pin for the Green LED control - default 22
const pinGreen = parseInt(process.env.COLOUR_PI_PIN_GREEN, 10) || 22;


///////////////////////////////////////////////////////////////////////////////
// Cylon Robot - controlling the LED RGB strip
//////////////////////////////////////////////////////////////////////////////
Cylon.robot({
    name: 'colour-pi',
    events: ['colour_set'],

    // Expose commands to be called through socket.io
    // e.g. send 'set_colour' message to '/api/robots/colour-pi'
    commands: function() {
	return {
	    set_colour: this.setColour
	};
    },

    // Tell the Cylon framework we are using a raspberry pi
    connections: {
	raspi: { adaptor: 'raspi', port: "/dev/ttyACM0" },
    },

    // Tell the Cylon framework what pins we are using and how to drive them
    devices: {
	led_b: { driver: 'led', pin: pinBlue },
	led_r: { driver: 'led', pin: pinRed },
	led_g: { driver: 'led', pin: pinGreen }
    },

    // setColour of the RGB strip
    //   r - red value 0-255
    //   g - green value 0-255
    //   b - blue value 0-255
    setColour: function(r,g,b) {
	// set the amount of each colour
	this.led_r.brightness(r);
	this.led_g.brightness(g);
	this.led_b.brightness(b);

	// ensure the LEDs are turned on
	this.led_r.turnOn();
	this.led_g.turnOn();
	this.led_b.turnOn();

	// Log to the console what was set
	console.log('colour_set', [this.led_r.currentBrightness(), this.led_g.currentBrightness(), this.led_b.currentBrightness()]);
	// emit back out to the world what was just set
	this.emit('colour_set', [this.led_r.currentBrightness(), this.led_g.currentBrightness(), this.led_b.currentBrightness()]);
    },

    // Main Cylon do work loop
    work: function(my) {
	console.log('start');

	my.led_r.turnOn();
	my.led_g.turnOn();
	my.led_b.turnOn();
    },

}).start();

///////////////////////////////////////////////////////////////////////////////
// Web server - to serve static files
//////////////////////////////////////////////////////////////////////////////

// Create the express server using SSL
// Serve all files under the public as static content
const app = express();
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(helmet.hsts({
    maxAge: ONE_YEAR,
    includeSubdomains: true,
    force: true
}));

// Create the https and Socket IO servers
const server = https.createServer(https_options, app);

// Start listening for requests
server.listen(httpsPort);



///////////////////////////////////////////////////////////////////////////////
// Cylon Websocket - to communicate between the web page and the Cylon Robot
//////////////////////////////////////////////////////////////////////////////
Cylon.api('socketio', {  host: '0.0.0.0',  // Listen on any ip address
			 port: wssPort,
			 ssl: https_options,
		      });
