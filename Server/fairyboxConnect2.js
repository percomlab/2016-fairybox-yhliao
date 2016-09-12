var net = require('net');
var btSerial_bt04 = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var btSerial_bt05 = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var btSerial_bt06 = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var car4Id;
var position4;
var car5Id;
var position5;
var car6Id;
var position6;
var mode;

var client = new net.Socket();
client.connect(1667, '127.0.0.1', function() {
    console.log('Connected');
    client.write('client2');
});

function carIdChart(name) {
	if (name == 'MyBT') {
		return 'A';
	} else if (name == 'bt02') {
		return 'B';
	} else if (name == 'bt03') {
		return 'C';
	} else if (name == 'bt04') {
		return 'D';
	} else if (name == 'bt05') {
		return 'E';
	} else if (name == 'bt06') {
		return 'F';
	}
}

function sendMessageToCar(btSerial, name) {
	client.on('data', function(data) {
	    console.log('Received: ' + data);
	    var x = data.toString('utf-8').split("$");
	    var myCarId = carIdChart(name);
	    
	    for (var i = 0; i < x.length; i++) {
	    	if (x[i] == 'c') {
		    	btSerial.write(new Buffer('c', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send c OK");
					if (err) console.log(err);
				});
				mode = 'home';
		    } else if (x[i] == 'v') {
		    	btSerial.write(new Buffer('c', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send c OK");
					if (err) console.log(err);
				});
				mode = 'show';
		    } else if (x[i] == 'a') {
		    	btSerial.write(new Buffer('a', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send a OK");
					if (err) console.log(err);
				});
		    } else if (x[i] == 's') {
		    	btSerial.write(new Buffer('s', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send s OK");
					if (err) console.log(err);
				});
		    } else if (x[i] == 'd') {
		    	btSerial.write(new Buffer('d', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send d OK");
					if (err) console.log(err);
				});
		    } else if (x[i] == 'q') {
		    	btSerial.write(new Buffer('q', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send q OK");
					if (err) console.log(err);
				});
		    } else if (x[i] == 'w') {
		    	btSerial.write(new Buffer('w', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send w OK");
					if (err) console.log(err);
				});
		    } else if (x[i] == 'e') {
		    	btSerial.write(new Buffer('e', 'utf-8'), function(err, bytesWritten) {
					console.log(name, "send e OK");
					if (err) console.log(err);
				});
		    } else if (x[i].length == 2 && x[i].substr(1,2).charCodeAt(0) >= 49 && x[i].substr(1,2).charCodeAt(0) <= 54) {
		    	var id = x[i].substr(0,1);
		    	var parkingTarget = x[i].substr(1,2);
		    	console.log('id:', id);
		    	console.log('parkingTarget:', parkingTarget);
		    	if (id == myCarId) {
		    		btSerial.write(new Buffer(parkingTarget, 'utf-8'), function(err, bytesWritten) {
						console.log(name, "send", parkingTarget, "OK");
						if (err) console.log(err);
					});
		    	}
	        } else if (x[i].charCodeAt(0) >= 65 && x[i].charCodeAt(0) <= 70) {
	        	console.log('orderPlanning:', x[i]);
            	var n = x[i].toString('utf-8').split("");
            	if (mode == 'home') {
            		for (var j = 0; j < n.length; j++) {
	            		var wait = j * 5000;
	            		if (n[j] == myCarId) {
	            			setTimeout(function(){
	                        	btSerial.write(new Buffer('m', 'utf-8'), function(err, bytesWritten) {
									console.log(name, "send Back! OK");
									if (err) console.log(err);
								});
	                    	}, wait);
	            		}
	            	}
            	} else if (mode == 'show') {
            		var k = 0;
            		for (var j = n.length-1; j > -1; j--) {
            			var wait = k * 3000;
            			if (n[j] == myCarId) {
            				setTimeout(function(){
								btSerial.write(new Buffer('M', 'utf-8'), function(err, bytesWritten) {
									console.log(name, "send Show! OK");
									if (err) console.log(err);
								});
							}, wait);
            			}
            			k++;
            		}
            	}
	        }
	    }

	});
}

function receiveCarPosition(btSerial, carId, position) {
	btSerial.on('data', function(buffer) {
		console.log(buffer.toString('utf-8'));				
		var x = buffer.toString('utf-8').split("");
		if (x.length == 1) {
			carId = x[0];
		} else if (x.length == 2) {
			position = buffer.toString('utf-8');
		}
		console.log('carId = ', carId);
		console.log('position = ', position);
		if (carId != undefined && position != undefined) {
			client.write(carId + position);
			//client.write(position);
		}
		
	});
};


btSerial_bt04.on('found', function(address, name) {
	console.log('found: ', address);
	console.log('found: ', name);
	if (name == "bt04") {
		btSerial_bt04.findSerialPortChannel(address, function(channel) {
			btSerial_bt04.connect(address, channel, function() {
				console.log(name, 'connected');
				//var car4 = new Car(undefined, undefined, undefined);
				//-------------------------functions------------------------
				sendMessageToCar(btSerial_bt04, name);
				receiveCarPosition(btSerial_bt04, car4Id, position4);
				//---------------------------------------------------------------------------
			}, function () {
				console.log('cannot connect');
			});

	        // close the connection when you're ready
		    btSerial_bt04.close();
		}, function() {
		    console.log('found nothing');
		});
	}
});


btSerial_bt05.on('found', function(address, name) {
	if (name == "bt05") {
		btSerial_bt05.findSerialPortChannel(address, function(channel) {
			btSerial_bt05.connect(address, channel, function() {
				console.log(name, 'connected');
				//var car4 = new Car(undefined, undefined, undefined);
				//-------------------------functions------------------------
				sendMessageToCar(btSerial_bt05, name);
				receiveCarPosition(btSerial_bt05, car5Id, position5);
				//---------------------------------------------------------------------------
			}, function () {
				console.log('cannot connect');
			});

	        // close the connection when you're ready
		    btSerial_bt05.close();
		}, function() {
		    console.log('found nothing');
		});
	}
});

btSerial_bt06.on('found', function(address, name) {
	if (name == "bt06") {
		btSerial_bt06.findSerialPortChannel(address, function(channel) {
			btSerial_bt06.connect(address, channel, function() {
				console.log(name, 'connected');
				//var car4 = new Car(undefined, undefined, undefined);
				//-------------------------functions------------------------
				sendMessageToCar(btSerial_bt06, name);
				receiveCarPosition(btSerial_bt06, car6Id, position6);
				//---------------------------------------------------------------------------
			}, function () {
				console.log('cannot connect');
			});

	        // close the connection when you're ready
		    btSerial_bt06.close();
		}, function() {
		    console.log('found nothing');
		});
	}
});

btSerial_bt04.inquire();
btSerial_bt05.inquire();
btSerial_bt06.inquire();

client.on('close', function() {
    console.log('Connection closed');
});