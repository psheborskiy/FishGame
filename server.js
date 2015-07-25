var express = require('express');
var app = express();

app.use(express.static(__dirname));
app.use("/style", express.static(__dirname + '/style'));
app.use("/socket.io", express.static(__dirname + '/socket.io'));

app.get('/', function (req, res) {
  res.sendFile('index.html', {root: __dirname });
});

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

//===================SOCKET====================
var io = require('socket.io').listen(server); 
var foods;
var allPlayers = {};

io.on('connection', function(socket) {

	var player = {
			
			id : 0,
            name : '',
			size : 36,
			score : 0,
			speed : 300,
            flip: 0,
			x : 1450,
			y: 780
	};


	socket.on('newPlayer', function(msg) {
		console.log("NEW PLAYER CONNECTED: " + msg);
		msg ? createPlayer(msg) : createPlayer('anonim');
	});


	socket.on('move', function(msg) {

		if (!speedHackProtect(msg.x, msg.y)) {
			socket.disconnect();
			return;
		}

		player.x = msg.x;
		player.y = msg.y;
        player.flip = msg.flip ? msg.flip : player.flip ;
		detectCollision();
        detectFishCollision();
	});


	socket.on('disconnect', function () {

        delete allPlayers[ (socket.id).toString().substr(0, 5) ];
        player = undefined;
        console.log("Player disconected");
        io.sockets.emit('playerDisconnect', (socket.id).toString().substr(0, 5));
        console.log(allPlayers);
    });


    function createPlayer(name) {

		player.id = (socket.id).toString().substr(0, 5); // Player ID, 5 chars
        player.name = name.slice(0,10);

		setTimeout(function(){
				socket.emit('createFoodFromServer', foods ); // send food coords to players
                if (player)
				    allPlayers[player.id] = player;

		},2000);

    }


	function detectCollision() {

	  for(var i = 0; i < foods.length; i++)
		if (player.x>foods[i].x-player.size+12 && player.x<foods[i].x+player.size-12)
			if(player.y>foods[i].y-player.size+20 && player.y<foods[i].y+player.size-20) {
				
				incPlayerSize();
				decPlayerSpeed();
                intScore();
				relocateFood(foods[i]);
				io.sockets.emit('refreshFood', foods );
                socket.emit('upScore', player);
				console.log('detect');
			
	  		}

	}


    function detectFishCollision() {

        for(var enemy in allPlayers) {

            if(player.id === allPlayers[enemy].id)
                continue;

            var v1 = getDistanceBetweenTwoPoints(player.x, player.y, allPlayers[enemy].x, allPlayers[enemy].y);
            var v2 = getPlayerRadius(allPlayers[enemy]);

            if(v1<v2) {

                if(player.size === allPlayers[enemy].size)
                    continue;

                var loser = (player.size > allPlayers[enemy].size) ? allPlayers[enemy].id : player.id;
                io.sockets.emit('lose', loser);
                delete allPlayers[ loser ];
                return;

            }
        }
    }


    function getPlayerRadius(enemy) {

        return Math.round(player.size/2 + Math.round(enemy.size/2));
    }


    function getDistanceBetweenTwoPoints(x1, y1, x2, y2) {

        return Math.sqrt( Math.pow((x2-x1),2) +  Math.pow((y2-y1),2) );
    }


	function setPlayerSize(size) {

		player.size = size;
	}


	function incPlayerSize() {

		player.size>400 ? 400 : player.size +=2;
	}


	function incPlayerSpeed() {

		player.speed>300 ? 300 : player.speed +=3;
	}


	function decPlayerSpeed() {

		player.speed<100 ? 100 : player.speed -=3;
	}


    function intScore() {

        player.score +=10;
    }


    function speedHackProtect(newX, newY) {

    	if(Math.abs(newX - player.x) > 6 || Math.abs(newY - player.y) > 6) {

    		io.sockets.emit('lose', player);
	    	delete allPlayers[ (socket.id).toString().substr(0, 5) ];
	        player = undefined;
	        console.log("Player banned bane IP");
	        socket.emit('lose')
	        return 0;
    	}

    	return 1;
    }

});


function relocateFood(food) {
	
	console.log('relocate food');
	food.x = Math.floor(Math.random() * (2800 - 50 + 1)) + 50;
	food.y = Math.floor(Math.random() * (1600 - 20 + 1)) + 20;

}


+(function createFood() {

	foods = new Array (
		{'id': 0, 'x': 200, 'y': 200},
		{'id': 1, 'x': 500, 'y': 400},
		{'id': 2, 'x': 800, 'y': 200},
		{'id': 3, 'x': 1300, 'y': 500},
		{'id': 4, 'x': 1700, 'y': 1100},
		{'id': 5, 'x': 2200, 'y': 800},
		{'id': 6, 'x': 1700, 'y': 1000},
		{'id': 7, 'x': 2780, 'y': 240},
		{'id': 8, 'x': 2100, 'y': 900},
		{'id': 9, 'x': 2500, 'y': 450}
	);

	console.log('Foods created');
})();


+(function sendMove() {

	setInterval(function() {
		io.sockets.emit('refresh', allPlayers);
	},10);

})();
