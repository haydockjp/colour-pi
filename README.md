# colour-pi
This repository is example code for an [Instructable](https://www.instructables.com).

This example shows how to
- Create a basic website using [Node.js](https://nodejs.org) over HTTPS
- Use the [Web Speech API Interfaces](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) and [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).
- Use the [Cylon.js](https://cylonjs.com/) framework to control an RGB LED strip on a Raspberry Pi
- Communicate over WSS (Secure Web sockets) from the web page to Cylon.js to control the color for the LED

The website has a single page which has a very basic layout. The webpage populates a drop down list with colours, which are located in the public/data/colours.json file on the server and "Voices" that are supported by [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

Pressing the Microphone button will start or stop the voice recognition, and will convert the audio to text. As you are talking, the interim guesses will be logged in the Interim Transcript box. The final guess will be put in to the Final Transcript Box.

If the text is a recognised colour (See public/data/coulors.json), the colour and RGB code will be put into the Found Colours box and the Output box will be set to that colour.

The output colour is also sent through a web socket to the Raspberry Pi, which will set the colour on the physical LEDs.

Instead of saying the colour, you can select the colour from the Known Colours selection box. This will speak the colour and set the output colour, as well as setting the physical LED colour.

The selecting a voice from the Known Voices list changes the voice used for the speech synthesizer.

*Note*
- You will need speakers or headphones to hear the speech synthesizer
- You will need to give access to your microphone for the voice recognition to work
- Because this access your microphone the site needs to be run under HTTPS
- The library cylon-api-socketio does not support https at this time. I have a pull request waiting to be merged, but until then you need to replace the /node_modules/cylon-api-socketio/lib/api.js with the file in this repository
- [pi-blaster](https://github.com/sarfata/pi-blaster) is needed to make this work. If you have problems with the physical LEDs, try restarting pi-blaster.

Please see the [Colour-pi instructable](https://goo.gl/AJhric) for full details.
