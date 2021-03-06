var net = require('net');
var btSerial_MyBT = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var btSerial_bt02 = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var btSerial_bt03 = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var car1Id;
var position1;
var car2Id;
var position2;
var car3Id;
var position3;
var mode;

var client = new net.Socket();
client.connect(1667, '127.0.0.1', function() {
    console.log('Connected');
    client.write('client1');
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

btSerial_MyBT.on('found', function(address, name) {
	console.log('found: ', address);
	console.log('found: ', name);
	if (name == "MyBT") {
	btSerial_MyBT.findSerialPortChannel(address, function(channel) {
		btSerial_MyBT.connect(address, channel, function() {
			console.log(name, 'connected');
			//var car1 = new Car(undefined, undefined, undefined);
			//-------------------------functions------------------------
			sendMessageToCar(btSerial_MyBT, name);
			receiveCarPosition(btSerial_MyBT, car1Id, position1);
			
			//---------------------------------------------------------------------------
		}, function () {
			console.log('cannot connect');
		});

        // close the connection when you're ready
	    btSerial_MyBT.close();
	}, function() {
	    console.log('found nothing');
	});
}
});

btSerial_bt02.on('found', function(address, name) {
	if (name == "bt02") {
		btSerial_bt02.findSerialPortChannel(address, function(channel) {
			btSerial_bt02.connect(address, channel, function() {
				console.log(name, 'connected');
				//var car1 = new Car(undefined, undefined, undefined);
				//-------------------------functions------------------------
				sendMessageToCar(btSerial_bt02, name);
				receiveCarPosition(btSerial_bt02, car2Id, position2);
				
				//---------------------------------------------------------------------------
			}, function () {
				console.log('cannot connect');
			});

	        // close the connection when you're ready
		    btSerial_bt02.close();
		}, function() {
		    console.log('found nothing');
		});
	}
});

btSerial_bt03.on('found', function(address, name) {
	if (name == "bt03") {
		btSerial_bt03.findSerialPortChannel(address, function(channel) {
			btSerial_bt03.connect(address, channel, function() {
				console.log(name, 'connected');
				//var car1 = new Car(undefined, undefined, undefined);
				//-------------------------functions------------------------
				sendMessageToCar(btSerial_bt03, name);
			// 	btSerial_bt03.write(new Buffer('c', 'utf-8'), function(err, bytesWritten) {
			// 	console.log(name, "send c OK");
			// 	if (err) console.log(err);
			// });
				receiveCarPosition(btSerial_bt03, car3Id, position3);
				
				//---------------------------------------------------------------------------
			}, function () {
				console.log('cannot connect');
			});

	        // close the connection when you're ready
		    btSerial_bt03.close();
		}, function() {
		    console.log('found nothing');
		});
	}
});

btSerial_MyBT.inquire();
btSerial_bt02.inquire();
btSerial_bt03.inquire();

client.on('close', function() {
    console.log('Connection closed');
});