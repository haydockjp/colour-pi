//////////////////////////////////////////////////////////////////////////////////
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//////////////////////////////////////////////////////////////////////////////////
// Get the elements on the web page that we want to interact with
const interimData = document.querySelector('#interim'),
      finalData = document.querySelector('#final'),
      output = document.querySelector('#output'),
      colourData = document.querySelector('#colourList'),
      statusData = document.querySelector('#status'),
      voiceData = document.querySelector('#voiceList'),
      foundData = document.querySelector('#found');

// Get the list of colour names and RGB values
const colours = getData('data/colours.json');

// Web APIs for Speech Recognition and Sythesis
const recognition = new SpeechRecognition(),
      speech = new SpeechSynthesisUtterance(),
      synth = window.speechSynthesis;

// global variables
let voices,
    device;

//////////////////////////////////////////////////////////////////////////////////
// Event Handers
//////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////
// When the available voices change
//////////////////////////////////////////////////////////////////////////////////
window.speechSynthesis.onvoiceschanged = function() {
    // Clear out the voiced drop down and repopulate
    $('#voiceList').empty();
    voices = speechSynthesis.getVoices();
    voices.forEach(addVoice);
    $('#voiceList').val(speech.lang);
};

	
//////////////////////////////////////////////////////////////////////////////////
// When the there is a result returned from the voice recognition
//////////////////////////////////////////////////////////////////////////////////
recognition.onresult = function(event) {
    let results = event.results;
    
    let interimTranscript = '';
    // For each result, log it as interim or final transcript
    for (let i = event.resultIndex; i !== results.length; ++i) {
	let result = results[i];
	// If thi is a final result
	if (result.isFinal) {
	    // Log the final results, stop the record button and update colour output
	    log(finalData, results[0][0].transcript + ' (' + (results[0][0].confidence * 100).toFixed(2) + '%)');
	    toggleRecord();
	    updateOutput(results[0][0].transcript.toLowerCase());
	} else {
	    // Log the interim results, for interest
	    interimTranscript += result[0].transcript;
	    log(interimData, interimTranscript);
	}
    }
};

// If we want to do something at the end of the recognition, we can add it here
recognition.onend = function() {
};

// If we want to do something if there is an error, we can do it here
recognition.onerror = function(event) {
    toggleRecord();
	updateStatus('error');
};

//////////////////////////////////////////////////////////////////////////////////
// On selecting something from the list of colours
//////////////////////////////////////////////////////////////////////////////////
$('select#colourList').click(function() {
    // Set the text to say
    speech.text = $('#colourList option:selected').text();
    // Set the output colour
    updateOutput(speech.text.toLowerCase());
    // Say the colour
    synth.speak(speech);
});

//////////////////////////////////////////////////////////////////////////////////
// On selecting a new voice from the list of available voices
//////////////////////////////////////////////////////////////////////////////////
$('select#voiceList').click(function() {
    // Update the text to say,
    // set the synthersizer voice and language
    // say the new voice
    let selected = $(this).find(":selected");
    speech.text = selected.text();
    speech.lang = selected.val();
    speech.voice = voices[selected.index()]
    recognition.lang = speech.lang;
    synth.speak(speech);
});

//////////////////////////////////////////////////////////////////////////////////
// On clicking the record button, toggle start and stop listening for colours
//////////////////////////////////////////////////////////////////////////////////
$('#record').click(toggleRecord);



//////////////////////////////////////////////////////////////////////////////////
// Hand a request to toggle the record button
//////////////////////////////////////////////////////////////////////////////////
function toggleRecord() {
    // Stop or start the voice recognition
    // Toggle the record icon and colour using css classes
    let obj = $('#record');
    if ($(obj).hasClass('unmute')) {
	recognition.start();
	updateStatus('Listening...');
    } else {
	recognition.stop();
	updateStatus('Waiting...');
    }
    $(obj).toggleClass('mute');
    $(obj).toggleClass('unmute');
    $(obj).toggleClass('red');
    $(obj).toggleClass('green');
};

//////////////////////////////////////////////////////////////////////////////////
// Log a message to a html element, e.g. a div
//////////////////////////////////////////////////////////////////////////////////
function log(data, message) {
    data.innerHTML = message + '<br>' + data.innerHTML;
}

//////////////////////////////////////////////////////////////////////////////////
// Update the status text on the apge
//////////////////////////////////////////////////////////////////////////////////
function updateStatus(message) {
    statusData.innerHTML = message;
}

//////////////////////////////////////////////////////////////////////////////////
// Hande updating the change of the colour to output
//////////////////////////////////////////////////////////////////////////////////
function updateOutput(colour) {
    // Check that there is colour found
    if (colours[colour]!==undefined) {
	// Parse the colour into R,G,B values
	// '#000000'
	let r = parseInt(colours[colour].slice(1, 3), 16),
            g = parseInt(colours[colour].slice(3, 5), 16),
            b = parseInt(colours[colour].slice(5, 7), 16);
	// Update the output colour text and background colour
	output.innerHTML = colours[colour];
	output.style.background = colours[colour];
	output.style.color = getFontColour(r,g,b);
	// Log that we found a colour 
	log(foundData, colour + ' => ' +colours[colour]);
	// Sent a message to the RPi through socket IO
	// to change the physical LED strip colour
	device.emit('set_colour', r,g,b)
    }
}

//////////////////////////////////////////////////////////////////////////////////
// Work out a good font colour to use against the background colour
//////////////////////////////////////////////////////////////////////////////////
function getFontColour(r,g,b) {
    output.innerHTML += ' (' + r + ', ' + g + ', ' + b +')';
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186
	? '#000000'
	: '#FFFFFF';
}

//////////////////////////////////////////////////////////////////////////////////
// Get data from a filename or URL and return the data as json
//////////////////////////////////////////////////////////////////////////////////
function getData(filename) {
    let json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': filename,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
};

//////////////////////////////////////////////////////////////////////////////////
// Add a new voice to the voice drop down
//////////////////////////////////////////////////////////////////////////////////
function addVoice(voice) {
    voiceData.add( new Option(voice.name, voice.lang) );
}

//////////////////////////////////////////////////////////////////////////////////
// When the HTML page has loaded and the document is ready
//////////////////////////////////////////////////////////////////////////////////
$( document ).ready(function() {
    // Update the status
    updateStatus('Waiting...');

    // Add the coloutd from the data we retrieved fromt he server
    for (c in colours) {colourData.add( new Option(c,colours[c]) );}

    // Set up the default values for the speech recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en';
    
    // Set up the default values for the speech synthersizer
    speech.lang = 'en-GB';
    speech.rate = 1.0;

    // Connect the the RPi Cylon WebSocket
    device = io(window.location.origin + ':1443/api/robots/colour-pi', { transports: ['websocket'], rejectUnauthorized: false });
    // Handle any messages that come back from the Cylon Robot
    device.on('message', deviceMessage);
});

function deviceMessage(payload) {
    // on a device message, just log to the console
    console.log('On Device', JSON.stringify(payload));
}
