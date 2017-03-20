var request = require('request');
var Promise = require('bluebird');

/*
the queue prevents multiple requests from getting called at the same time
because the SOC server sometimes fails when that happens.
the inProgress flag basically prevents new AJAX calls until the
current request completes (no longer in progress).
*/

var numberOfFailsAllowed = 5;
var inProgress = false;
var queue = [];

// sets up the function that will be called, but doesn't call the function.
// rather it returns the function, which is ready to be called in its queue turn
function createParameters(url, resolve, reject, count) {
	return function () {
		inProgress = true;
		request.get(url, function (error, response, body) {
			if (error) {
				if (count < numberOfFailsAllowed) {
					addToQueue(url, resolve, reject, count+1);
				} else {
					reject(error);
				}
			} else {
				inProgress = false;
				callNext();
				try {
					var data = JSON.parse(body);
					resolve(data);
				} catch(e) {
				 	reject(e);
				}
			}
		});
	}
}

// deque
function callNext() {
	if (!inProgress && queue.length > 0) {
		var nextFunction = queue.shift();
		nextFunction();
	}
}

// enque
function addToQueue(url, resolve, reject, count) {
	count = count || 0;
	var functionToBeCalled = createParameters(url, resolve, reject, count);
	queue.push(functionToBeCalled);
	callNext();
}

// assemble the request
// thenable response
module.exports = function (url, cached) {
	cached = cached || false;
	var refresh = '?refresh=Mary4adAL1ttleLamp';
	var urlBase = 'http://web-app.usc.edu/web/soc/api';
	url = urlBase + url;
	if (cached) url += refresh;

	return new Promise(function (resolve, reject) {
		addToQueue(url, resolve, reject);
	});
};
