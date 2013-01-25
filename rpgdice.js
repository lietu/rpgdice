/**
 * RPG dice roller
 *
 * Created by Janne Enberg aka. Lietu
 * http://lietu.net/
 *
 * Set the "RPG_DICE_ROLLER_DEBUG" to true to enable detailed logging to console
 * Tested on all modern browsers (Internet Explorer 9, Firefox 5, Google Chrome 12, Safari 5, Opera 11.5)
 * This code requires no JavaScript libraries of any kind, e.g. jQuery.
 * If this does not work on some browser, fix it and release the fix, or give me the fix and I'll release it.
 *
 * This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.
 *
 * This allows you to share and modify the work, including for commercial uses, as long as:
 *  - You credit me on the original code 
 *  - Any altered code will be released under the exact same license
 *
 * http://creativecommons.org/licenses/by-sa/3.0/
 */

// Whole-script strict mode syntax
'use strict';

// Uncomment to move script to private namespace
/*
(function(){ 
*/

// We define global variables so people can call "RpgDiceRoller.throwFromString('1d8').result;" etc. from console...
// Feel free to uncomment the above and the last lines in the file to move the class in private namespace, it works fine..
var RpgDiceRoller = { };
var RPG_DICE_ROLLER_DEBUG = true;

// A few configuration options for easily modifying some parameters
RpgDiceRoller.config = {
	// What is the base element with all the other elements in it
	baseElementId: 'RpgDiceRoller',

	// What is the class of the element with the throw string in it
	sourceElementClass: 'source',

	// What is the class of the trigger for throwing
	triggerElementClass: 'trigger',

	// What is the class of the element we want our messages in
	targetElementClass: 'target',

	// What property of the target element we set our messages in
	targetElementProperty: 'innerHTML',

	// How should different message lines be separated?
	messageSeparator: "<br />\n"
};

/**
 * Regular expression for die strings, e.g. 3d10+2
 * Selects all interesting bits, in above, 3, 10, +2
 */
RpgDiceRoller.dieStringRegExp = /^(\d+)d(\d+)([+\-]\d+)?$/;

/**
 * Create a dumb console in case your browser is unable to provide you with one
 */
RpgDiceRoller.createConsole = function() {

	// If we want to debug, but have no console, create one
	if( RPG_DICE_ROLLER_DEBUG ) {
		if( typeof console==='undefined' ) {
			console = {};
		}
		if( typeof console.log==='undefined' ) {
			// Initialize variables
			var consoleElement, bodyElement;
			
			// Create a new div as a dumb console output container
			consoleElement = document.createElement('DIV');
			// And get the document body
			bodyElement = document.getElementsByTagName('body')[0];
			
			// Theoretically possible that we'll try to do this too soon and body does not exist
			if( bodyElement!==undefined ) {

				// Append our console div to the document body
				bodyElement.appendChild(consoleElement);

				// And build the logger function
				console.log = function( what ) {
					consoleElement.innerHTML += what;
					consoleElement.innerHTML += '<br />';
				};

				console.log( 'Created dumb console' );
			}
		}
	}			
};

/**
 * Log something to console, if debugging is enabled and it is possible to do so
 * @param {Mixed} what What to log
 */
RpgDiceRoller.log = function( what ) {
	// Is debugging enabled
	if( RPG_DICE_ROLLER_DEBUG ) {
		// If we have no console, or it cannot log, create one that can
		if( !( typeof console!=='undefined' && typeof console.log!=='undefined' ) ) {
			RpgDiceRoller.createConsole();
		}

		// Non-strings have to go through un-touched
		if( typeof what!=='string' ) {
			console.log( what );
		// Strings we prepend with an identificator
		} else {
			console.log( 'RpgDiceRoller: ' + what );
		}

	}
};

/**
 * Get a random number between min and max
 * @param {Number} min Minimum value
 * @param {Number} max Maximum value
 * @return {Number} A number between min and max
 */
RpgDiceRoller.getRandom = function( min, max ) {
	// Cast them to numbers, you never know what other JS programmers give you
	min = Number(min);
	max = Number(max);
	
	// Initialize variables
	var result, tmp;

	// If they are the same just return one
	if( min === max ) {

		RpgDiceRoller.log( 'Generating a random number between ' + min + ' and ' + max + ' is impossible, returning ' + min );

		return min;
	}

	// If they are the wrong way around, let's be helpful and switch them
	if( max < min ) {

		RpgDiceRoller.log( 'Generating a random number between minimum value ' + min + ' and maximum value ' + max + ' requires flipping them' );

		tmp = max;
		max = min;
		min = tmp;
	}

	RpgDiceRoller.log( 'Generating a random number between ' + min + ' and ' + max );

	// Now comes the magic
	// Math.random() gives a fraction between 0 and 1
	// Multiply that with number X and it gives you 0 ... X range
	// Since a die does not have "0" value, we want 1 - X, thus we need to get (0 ... X-1) + 1
	result = Math.floor( Math.random() * (max) ) + min;

	RpgDiceRoller.log( 'Result is ' + result );

	return result;
};

/**
 * Roll a die with given number of sides
 * @param {Number} sides The number of sides in the die to roll
 * @return {Number} The result given by the roll
 */
RpgDiceRoller.roll = function( sides ) {
	// Cast to number, you never know what other JS programmers give you
	sides = Number(sides);

	// If data looks invalid, throw exception
	if( sides < 1 ) {
		throw new Error('Invalid number of sides given to RpgDiceRoller.roll: (' + (typeof sides) + ') "' + sides + '"');
	}

	// Get a random value for the roll
	var result = RpgDiceRoller.getRandom(1, sides);

	RpgDiceRoller.log( 'Throwing a die with ' + sides + ' sides gave a result of ' + result );

	return result;
};

/**
 * Throw dice from a string like "3d10+2"
 */
RpgDiceRoller.throwFromString = function( string ) {
	RpgDiceRoller.log( 'Throwing dice from string ' + string );
	
	// Initialize variables
	var originalString, stringData, throwSettings, throwResult, total, messages, die, sign, value, dieResults;

	// Save original string so we can show it
	originalString = string;

	// Take away spaces, we don't want them, but they might look nice when writing 3d10 + 2 or something...
	// By the way, why is this such a difficult step for so many credit card forms?
	string = string.replace(' ', '');

	// Check for valid string
	if( RpgDiceRoller.dieStringRegExp.test(string)===false ) {
		throw new Error( string + ' did not validate as a valid string for throwing, try something like "3d10+2"' );
	}

	// Execute RegExp on string to get all parts
	stringData = RpgDiceRoller.dieStringRegExp.exec( string );
	// Build a nicer settings object out of it
	throwSettings = {
		dieCount: stringData[1],
		sides: stringData[2],
		extra: stringData[3] || ''
	};

	RpgDiceRoller.log( 'Going to throw ' + throwSettings.dieCount + ' dies with ' + throwSettings.sides + ' sides each' + (throwSettings.extra!==''?' and then doing ' + throwSettings.extra:'') );

	// Variables to store per-throw result and total
	throwResult = 0;
	total = 0;
	// Build nice messages to end user
	messages = [];
	// And give out all die results separately in case they want them
	dieResults = [];

	// Loop through all dies to throw
	for( die = 1; die <= throwSettings.dieCount; ++die ) {
		// Throw the die
		throwResult = RpgDiceRoller.roll( throwSettings.sides );
		// Add to total
		total += throwResult;
		// Add to die results
		dieResults.push( throwResult );

		// Make a nice message
		messages.push('Die ' + die + ' gave ' + throwResult);

		RpgDiceRoller.log( 'Die ' + die + ' gave ' + throwResult + ', total is now ' + total );
	}

	// If we had some extra in the string, e.g. +2, process that now
	if( throwSettings.extra!=='' ) {

		// Separate sign and value
		sign = throwSettings.extra.substring(0,1);
		value = Number( throwSettings.extra.substring(1) );

		// Add or substract depending on the sign
		if( sign==='+' ) {
			RpgDiceRoller.log( 'Now adding ' + value + ' to throw result' );
			messages.push('Adding ' + value);

			total += value;
		} else if( sign==='-' ) {
			RpgDiceRoller.log( 'Now substracting ' + value + ' from throw result' );
			messages.push('Substracting ' + value);

			total -= value;

		// Always nice to have an else
		} else {
			throw new Error( 'Invalid sign for "extra" settings ' + sign + ' ... how it got through the RegExp test is a mystery.' );
		}

		RpgDiceRoller.log( 'After processing ' + throwSettings.extra + ' the total is now ' + total );
	}

	messages.push('Final result for throw ' + originalString + ': ' + total);

	RpgDiceRoller.log( 'Final result for throw ' + originalString + ': ' + total );

	RpgDiceRoller.log( 'The full settings parsed for this row will be logged as the next item' );
	RpgDiceRoller.log( throwSettings );

	// Return both result, per-die results, and messages
	return {
		result: total,
		dieResults: dieResults,
		messages: messages
	};
};

/**
 * Initialize the event handlers on DOM elements
 */
RpgDiceRoller.init = function() {
	// Initialize variables
	var element = null, sourceElement = null, targetElement = null, triggerElement = null, childCount , i, showMessage, throwDice;

	// Try and get our base element
	element = document.getElementById( RpgDiceRoller.config.baseElementId );

	// If found
	if( element!==undefined ) {

		// Loop through children, looking for our elements
		childCount = element.children.length;
		for( i=0; i<childCount; ++i ) {
			// If this element has a classname
			// ... trust me, it can happen that it doesn't, it can for example be a magical whitespace element
			if( element.children[i].className ) {

				// See if it's any of the ones we want
				switch( element.children[i].className ) {

					case RpgDiceRoller.config.sourceElementClass:
						if( sourceElement===null ) {

							// Just save the element for later
							sourceElement = element.children[i];

							RpgDiceRoller.log( 'Found source element. Logging element.' );
							RpgDiceRoller.log( sourceElement );

						} else {

							RpgDiceRoller.log( 'Found more source elements, ignoring... Logging element.' );
							RpgDiceRoller.log( element.children[i] );

						}
						break;

					case RpgDiceRoller.config.triggerElementClass:
						if( triggerElement===null ) {

							// Just save the element for later
							triggerElement = element.children[i];

							RpgDiceRoller.log( 'Found trigger element. Logging element.' );
							RpgDiceRoller.log( triggerElement );

						} else {

							RpgDiceRoller.log( 'Found more trigger elements, ignoring... Logging element.' );
							RpgDiceRoller.log( element.children[i] );

						}
						break;

					case RpgDiceRoller.config.targetElementClass:
						if( targetElement===null ) {

							// Just save the element for later
							targetElement = element.children[i];

							RpgDiceRoller.log( 'Found target element. Logging element.' );
							RpgDiceRoller.log( sourceElement );

						} else {

							RpgDiceRoller.log( 'Found more target elements, ignoring... Logging element.' );
							RpgDiceRoller.log( element.children[i] );

						}
						break;
				}
			}
		}

		// Check what items we found, and if we can continue...

		if( sourceElement===null && triggerElement===null ) {
			RpgDiceRoller.log( 'Did not find a source or target element, cannot continue' );
			return;
		}

		if( sourceElement===null ) {
			RpgDiceRoller.log( 'Did not find a source element, will use a prompt dialog instead' );
		}

		if( triggerElement===null ) {
			RpgDiceRoller.log( 'Did not find a trigger element, will use onblur event on source instead' );
		}

		if( targetElement===null ) {
			RpgDiceRoller.log( 'Did not find a target element, will use alert instead' );
		}

		// Function to show a message in the target
		showMessage = function(message) {
			// If we have no target element
			if( targetElement===null ) {
				RpgDiceRoller.log( 'No target element to put message in, alert()-ing instead' );
				alert( message );
			} else if( typeof targetElement[ RpgDiceRoller.config.targetElementProperty ]==='undefined' ) {
				RpgDiceRoller.log( 'Target element does not seem to have property ' + RpgDiceRoller.config.targetElementProperty + ' ... alert()-ing instead' );
				alert( message );
			} else {
				RpgDiceRoller.log( 'Updateing message to target element property ' + RpgDiceRoller.config.targetElementProperty );
				targetElement[ RpgDiceRoller.config.targetElementProperty ] = message;
			}
		};

		// Function to throw dice with a string and show results
		throwDice = function( throwString ) {
			var result, messages;
			
			try {
				// Try and throw, get the result
				result = RpgDiceRoller.throwFromString( throwString );

				// If all was ok, join the messages with the message separator and show them
				showMessage( result.messages.join( RpgDiceRoller.config.messageSeparator ) );

			// In case of errors
			} catch (e) {

				// Build some messages to show
				messages = [
					'Error throwing with ' + throwString,
					'Error was: ' + (typeof e.message!=='undefined'?e.message:'unknown')
				];

				showMessage( messages.join( RpgDiceRoller.config.messageSeparator ) );

			}
		};

		// If we have no trigger, but we have a source, attach a listener to onblur of source
		if( triggerElement===null && sourceElement!==null ) {
			// This will trigger our throws
			sourceElement.onblur = function() {
				// Try and throw dice with the source element's value
				throwDice( sourceElement.value );		
			};
			
			// Also, to be nice, make sure hitting enter on source will trigger throw
			sourceElement.onkeyup = function( event ) {
				// Try getting event also on IE
				if( !event ) {
					event = window.event;
				}

				// Keycode 13 = enter key
				if( event.keyCode===13 ) {
					// Just throw dice with source value
					throwDice( sourceElement.value );
				}
			};

		// If we have a trigger, but no source, ask with prompt()
		} else if( triggerElement!==null && sourceElement===null ) {

			triggerElement.onclick = function() {
				// Ask for user to give a string
				var string = prompt('Please input string to throw dice with, e.g. "3d10+2"');
				// And throw dice with it
				throwDice( string );
			};

		// If we have a source and a trigger, use source's contents directly
		} else if( sourceElement!==null && triggerElement!==null ) {

			triggerElement.onclick = function() {
				// Just throw dice with source value
				throwDice( sourceElement.value );
			};
			// Also, to be nice, make sure hitting enter on source will trigger throw
			sourceElement.onkeyup = function( event ) {
				// Try getting event also on IE
				if( !event ) {
					event = window.event;
				}

				// Keycode 13 = enter key
				if( event.keyCode===13 ) {
					// Just throw dice with source value
					throwDice( sourceElement.value );
				}
			};

		} else {
			throw new Error('Somehow missed a case of sourceElement and targetElement nullness');
		}

	} else {
		RpgDiceRoller.log( 'Did not find an element to bind to with the ID' + RpgDiceRoller.config.baseElementId );
	}
};

/**
 * Tests the quality of the getRandom() -function.
 * @param {String} testString A valid throw string to test randomness with, e.g. 10000d10
 */
RpgDiceRoller.testRandomness = function( testString ) {
	// Initialize some variables
	var resultCounts, throwResult, i, numResults, max, min, first, startTime, endTime;
		
	// If we weren't given a test string, default to throwing 10,000x 10-sided dice
	if( testString===undefined ) {
		testString = '10000d10';
	}
	
	// Throw and get the result
	startTime = new Date().getTime();
	throwResult = RpgDiceRoller.throwFromString( testString );
	endTime = new Date().getTime();
	
	// Get how many sides in the dice
	numResults = /d(\d+)/.exec(testString)[1];
	
	// Initialize result object
	resultCounts = {};
	for( i=1; i<=numResults; ++i) {
		resultCounts[i] = 0;
	}
		
	// Loop through all the results and count how of each different result we got
	numResults = throwResult.dieResults.length;
	for( i=0; i<numResults; ++i ) {
		
		// Increment the corresponding item in resultCounts
		++resultCounts[ throwResult.dieResults[i] ];
	}
	
	// Log results to console
	first = true;
	for( i in resultCounts ) {
		
		// If first result, initialize min and max values
		if( first===true ) {
			first = false;
			
			max = resultCounts[i];
			min = resultCounts[i];
		
		// For the other results, update min and max if appropriate
		} else {
			max = Math.max(max, resultCounts[i]);
			min = Math.min(min, resultCounts[i]);
		}
		
		console.log( i + ' results:' + "\t" + resultCounts[i] + "\t" + (Math.round((resultCounts[i]/numResults)*100 * 100)/100) + '%' );
	}
	
	console.log( 'Max value: ' + max );
	console.log( 'Min value: ' + min );
	console.log( 'Difference: ' + Math.abs( max - min ) );
	console.log( 'Time taken: ' + (endTime - startTime) + ' msec' );
};


// If we have no jQuery, try another solution that might work or might not work, should work on newer browsers...
// Source: http://dean.edwards.name/weblog/2006/06/again/ 
if( typeof jQuery==='undefined' ) {
	// Dean Edwards/Matthias Miller/John Resig
	RpgDiceRoller.timer = null;
	RpgDiceRoller.initialized = false;
	var init = function() {
		// quit if this function has already been called
		if (RpgDiceRoller.initialized) {
			return;
		}
		
		// flag this function so we don't do the same thing twice
		RpgDiceRoller.initialized = true;

		RpgDiceRoller.log( 'Document initialized (no jQuery detected)' );

		// kill the timer
		if (RpgDiceRoller.timer) {
			clearInterval(RpgDiceRoller.timer);
		}

		// do stuff

		// Call the RpgDiceRoller init
		RpgDiceRoller.init();
	};

	/* for Mozilla/Opera9 */
	if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", init, false);
	}

	/* for Internet Explorer */
	/*@cc_on @*/
	/*@if (@_win32)
		document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
		var script = document.getElementById("__ie_onload");
		script.onreadystatechange = function() {
			if (this.readyState == "complete") {
				RpgDiceRoller.log( 'Internet Explorer document readyState change callback triggered' );

				init(); // call the onload handler
			}
		};
	/*@end @*/

	/* for Safari */
	if (/WebKit/i.test(navigator.userAgent)) { // sniff
		RpgDiceRoller.timer = setInterval(function() {
			if (/loaded|complete/.test(document.readyState)) {

				RpgDiceRoller.log( 'Safari document readyState change callback triggered' );

				init(); // call the onload handler
			}
		}, 10);
	}

	/* for other browsers */
	window.onload = init;
// If we have jQuery, this is easy
} else {
	RpgDiceRoller.log( 'Found jQuery, creating document onready callback' );

	// Create a document onready callback to initialize our RpgDiceRoller
	jQuery(document).ready(function() {
		RpgDiceRoller.log( 'jQuery document onready callback triggered' );

		RpgDiceRoller.init();
	});
}

// Uncomment to move script to private namespace
/* 
}());
*/