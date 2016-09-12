var MAP_WIDTH = 6;
var MAP_HEIGHT = 3;

var Car = function Car(carId, init_x, init_y) {
    this.carId = carId;
    this.init_x = init_x;
    this.init_y = init_y;
    this.last_x = -1;
    this.last_y = -1;
    this.back = false;
};

var ParkingSpace = function ParkingSpace(x, y) {
    this.x = x;
    this.y = y;
    this.carId = null;
};

process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var net = require('net');
var play = require('play');
var cars = [];
var group1 = [];
var group2 = [];
var group3 = [];
var mode;
var selectedCars = [];

var parkingSpace1 = new ParkingSpace(0, 2);
var parkingSpace2 = new ParkingSpace(5, 2);
var parkingSpace3 = new ParkingSpace(0, 1);
var parkingSpace4 = new ParkingSpace(5, 1);
var parkingSpace5 = new ParkingSpace(0, 0);
var parkingSpace6 = new ParkingSpace(5, 0);
var parkingSpaces = [];

function distribute(group) {
    parkingSpaces = [parkingSpace1, parkingSpace2, parkingSpace3, parkingSpace4, parkingSpace5, parkingSpace6];
    for (var i = 0; i < cars.length; i++) {
        if (cars[i]['init_x'] == 0 || cars[i]['init_x'] == 5) {
            for (var j = 0; j < parkingSpaces.length; j++) {
                if (cars[i]['init_x'] == parkingSpaces[j]['x'] && cars[i]['init_y'] == parkingSpaces[j]['y']) {
                    parkingSpaces.splice(j, 1);
                }
            }
        } else {
            for (var k = 0; k < group.length; k++) {
                if (group[k]['carId'] == cars[i]['carId']) {
                    group.splice(k, 1);
                }
            }
            cars[i]['back'] = false;
            group.push(cars[i]);
        }
    }
    console.log('group = ', group);
    console.log('parkingSpaces = ', parkingSpaces);
}

function findOutGroupCars(group) {
    selectedCars = [];
    for (var i = 0; i < cars.length; i++) {
        for (var j = 0; j < group.length; j++) {
            if(cars[i]['carId'] == group[j]['carId']) {
                cars[i]['back'] = false;
                selectedCars.push(cars[i]);
            }
        }
    }
    for (var i = 0; i < selectedCars.length; i++) {
        for (var j = 0; j < group.length; j++) {
            if (selectedCars[i]['carId'] == group[j]['carId']) {
                selectedCars[i]['last_x'] = group[j]['init_x'];
                selectedCars[i]['last_y'] = group[j]['init_y'];
            }
        }
    }
    console.log('selectedCars = ', selectedCars);
}

function carParking(group, c) {
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 0 && parkingSpaces[i]['y'] == 2) {
            // 將左上的停車位分配給某台車
            parkLeftUp(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '1$');
        }
    }
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 5 && parkingSpaces[i]['y'] == 2) {
            // 將右上的停車位分配給某台車
            parkRightUp(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '2$');
        }
    }
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 0 && parkingSpaces[i]['y'] == 0) {
            // 將左下的停車位分配給某台車
            parkLeftDown(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '5$');
        }
    }
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 5 && parkingSpaces[i]['y'] == 0) {
            // 將右下的停車位分配給某台車
            parkRightDown(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '6$');
        }
    }
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 0 && parkingSpaces[i]['y'] == 1) {
            // 將左中的停車位分配給某台車
            parkLeftUp(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '3$');
        }
    }
    for (var i = 0; i < parkingSpaces.length; i++) {
        if (parkingSpaces[i]['x'] == 5 && parkingSpaces[i]['y'] == 1) {
            // 將右中的停車位分配給某台車
            parkRightUp(parkingSpaces[i], group);
            c.write(parkingSpaces[i]['carId'] + '4$');
        }
    }
    console.log('carParking:', group);
};


function parkLeftUp(parkingSpace, group) {
    for (var j = MAP_HEIGHT - 1; j >= 0; j--) {
        for (var i = 1; i < MAP_WIDTH - 1; i++) {
            for (var k = 0; k < group.length; k++) {
                if (group[k]['last_x'] == -1) {
                    if (group[k]['init_x'] == i && group[k]['init_y'] == j) {
                        parkingSpace['carId'] = group[k]['carId'];
                        group[k]['last_x'] = parkingSpace['x'];
                        group[k]['last_y'] = parkingSpace['y'];
                        return;
                    }
                }
            }
        }
    }
};

function parkLeftDown(parkingSpace, group) {
    for (var j = 0; j < MAP_HEIGHT; j++) {
        for (var i = 1; i < MAP_WIDTH - 1; i++) {
            for (var k = 0; k < group.length; k++) {
                if (group[k]['last_x'] == -1) {
                    if (group[k]['init_x'] == i && group[k]['init_y'] == j) {
                        parkingSpace['carId'] = group[k]['carId'];
                        group[k]['last_x'] = parkingSpace['x'];
                        group[k]['last_y'] = parkingSpace['y'];
                        return;
                    }
                }
            }
        }
    }
};

function parkRightUp(parkingSpace, group) {
    for (var j = MAP_HEIGHT - 1; j >= 0; j--) {
        for (var i = MAP_WIDTH -2; i >= 0; i--) {
            for (var k = 0; k < group.length; k++) {
                if (group[k]['last_x'] == -1) {
                    if (group[k]['init_x'] == i && group[k]['init_y'] == j) {
                        parkingSpace['carId'] = group[k]['carId'];
                        group[k]['last_x'] = parkingSpace['x'];
                        group[k]['last_y'] = parkingSpace['y'];
                        return;
                    }
                }
            }
        }
    }
};

function parkRightDown(parkingSpace, group) {
    for (var j = 0; j < MAP_HEIGHT; j++) {
        for (var i = MAP_WIDTH -2; i >= 0; i--) {
            for (var k = 0; k < group.length; k++) {
                if (group[k]['last_x'] == -1) {
                    if (group[k]['init_x'] == i && group[k]['init_y'] == j) {
                        parkingSpace['carId'] = group[k]['carId'];
                        group[k]['last_x'] = parkingSpace['x'];
                        group[k]['last_y'] = parkingSpace['y'];
                        return;
                    }
                }
            }
        }
    }
};

function orderPlanning(group, c) {
    var order = '';
    var carCount = parkingSpaces.length;
    while (carCount != 0) {
        for (var i = 0; i < group.length; i++) {
            if (group[i]['back'] == false) {
                var canMove = true;
                for (var j = 0; j < group.length; j++) {
                    if (group[j]['carId'] != group[i]['carId'] && group[j]['back'] == false) {
                        if (pathBlocked(group[i], group[j])) {
                            canMove = false;
                            break;
                        }
                    }
                }
                if (canMove == true) {
                    order += group[i]['carId'];
                    group[i]['back'] = true;
                    carCount--;
                }

            }
        }
    }
    console.log(order);
    order += '$';
    c.write(order);
};

function pathBlocked(movingCar, stopCar) {
    var startX = movingCar['init_x'];
    var startY = movingCar['init_y'];
    var endX = movingCar['last_x'];
    var endY = movingCar['last_y'];

    if (startY > endY) {
        while (startY != endY) {
            if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                return true;
            } else {
                startY--;
            }
        }
        if (startX > endX) {
            while (startX != endX) {
                if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                    return true;
                } else {
                    startX--;
                }
            }
        } else {
            while (startX != endX) {
                if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                    return true;
                } else {
                    startX++;
                }
            }
        }
    } else {
        while (startY != endY) {
            if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                return true;
            } else {
                startY++;
            }
        }
        if (startX > endX) {
            while (startX != endX) {
                if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                    return true;
                } else {
                    startX--;
                }
            }
        } else {
            while (startX != endX) {
                if (startX == stopCar['init_x'] && startY == stopCar['init_y']) {
                    return true;
                } else {
                    startX++;
                }
            }
        }
    }
    return false;
};

function orderPlanning_show(group, c) {
    var order = '';
    var carCount = group.length;
    while (carCount != 0) {
        for (var i = 0; i < group.length; i++) {
            if (group[i]['back'] == false) {
                var canMove = true;
                for (var j = 0; j < group.length; j++) {
                    if (group[j]['carId'] != group[i]['carId'] && group[j]['back'] == false) {
                        if (pathBlocked_show(group[i], group[j])) {
                            canMove = false;
                            break;
                        }
                    }
                }
                if (canMove == true) {
                    order += group[i]['carId'];
                    group[i]['back'] = true;
                    carCount--;
                }

            }
        }
    }
    console.log(order);
    order += '$';
    c.write(order);
};

function pathBlocked_show(movingCar, stopCar) {
    var endX = movingCar['init_x'];
    var endY = movingCar['init_y'];
    var startX = movingCar['last_x'];
    var startY = movingCar['last_y'];
    if (startY > endY) {
        while (startY != endY) {
            if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                return true;
            } else {
                startY--;
            }
        }
        if (startX > endX) {
            while (startX != endX) {
                if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                    return true;
                } else {
                    startX--;
                }
            }
        } else {
            while (startX != endX) {
                if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                    return true;
                } else {
                    startX++;
                }
            }
        }
    } else {
        while (startY != endY) {
            if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                return true;
            } else {
                startY++;
            }
        }
        if (startX > endX) {
            while (startX != endX) {
                if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                    return true;
                } else {
                    startX--;
                }
            }
        } else {
            while (startX != endX) {
                if (startX == stopCar['last_x'] && startY == stopCar['last_y']) {
                    return true;
                } else {
                    startX++;
                }
            }
        }
    }
    return false;
};

var server = net.createServer(function(c) {
    c.setEncoding('UTF-8');
    process.stdin.on('data', function (text) {
        console.log('input:', util.inspect(text));
        if (text == 'c\n') {
            c.write('c$');
            mode = 'home';
            console.log('mode = ', mode);
            play.sound('referContext.mp3');
        } else if (text == 'v\n') {
            c.write('v$');
            mode = 'show';
            console.log('mode = ', mode);
            play.sound('selectContext.mp3');
        } else if (text == 'a\n') {
            
            if (mode == 'home') {
                group1 = [];
                c.write('a$');
                distribute(group1);
                carParking(group1, c);
                orderPlanning(group1, c);
            } else if (mode == 'show') {
                c.write('q$');
                findOutGroupCars(group1);
                orderPlanning_show(selectedCars, c);
            }
            
        } else if (text == 's\n') {
            
            console.log('mode = ', mode);
            if (mode == 'home') {
                group2 = [];
                c.write('s$');
                distribute(group2);
                carParking(group2, c);
                orderPlanning(group2, c);
            } else if (mode == 'show') {
                c.write('w$');
                findOutGroupCars(group2);
                orderPlanning_show(selectedCars, c);
            }
            
        } else if (text == 'd\n') {
            
            console.log('mode = ', mode);
            if (mode == 'home') {
                group3 = [];
                c.write('d$');
                distribute(group3);
                carParking(group3, c);
                orderPlanning(group3, c);
            } else if (mode == 'show') {
                c.write('e$');
                findOutGroupCars(group3);
                orderPlanning_show(selectedCars, c);
            }
            
        }
    });

    c.on('data', function(data) {

        console.log("receiving data:" + data);
        var x = data.toString('utf-8').split("");
        

        if (data == 'client1') {
            c.write('client1 connected');
        } else if (data == 'client2') {
            c.write('client2 connected');
        } else {
            var car = new Car(undefined, undefined, undefined);
            if (x.length >= 3) {
                car['carId'] = x[x.length-3];
                car['init_x'] = x[x.length-2];
                car['init_y'] = x[x.length-1];
            }
            //console.log('car = ', car);
            if (car['carId'] != undefined && car['carId'].charCodeAt(0) >= 65 && car['carId'].charCodeAt(0) <= 90
                && car['init_x'] != undefined && car['init_y'] != undefined) {
                for (var i = 0; i < cars.length; i++) {
                    if (cars[i]['carId'] === car['carId']) {
                        //console.log(car['carId'], 'existed');
                        cars.splice(i, 1);
                    } else {
                        //console.log(car['carId'], 'not existed');
                    }
                }
                cars.push(car);
                if (cars.length == 6) {
                    console.log('cars = ', cars);
                }
                
            }
            
            // c.write('ok');
        }

    });
});

server.listen(1667, '127.0.0.1');
