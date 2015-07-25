(function() {

	var game = new Phaser.Game(1000, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
    var style = { font: "22px Arial", fill: "#333", wordWrap: false, align: "center"};
    var nameStyle = { font: "14px Arial", fill: "#000", wordWrap: false, align: "center"};
	var socket = io();

	var player = {

		name: "Fish",
		size: 0,
		score: 0,
        speed: 300
	};

	var otherPlayers = {};
	var emitters;
	var foods;

	function preload() {

	    game.load.image('bg', 'img/bg.png', true);
	    game.load.image('emeny', 'img/fish.png', true);
	    game.load.spritesheet('player', 'img/sfish.png',256, 256, 5);
	    game.load.image('bubble', 'img/bubble.png', true);
	    game.load.image('food', 'img/item.png', true);

	}


	function create() {

		game.add.tileSprite(0, 0, 3000, 1684, 'bg');
		game.world.setBounds(0, 0, 3000, 1684);
		game.physics.startSystem(Phaser.Physics.P2JS);

		createEmiter();
		createPlayer();
		refresh();
		getUserName();

	}


	function createPlayer() {

		player.sprite = game.add.sprite(1450, 780, 'player');
		player.sprite.animations.add('walk');
	    player.sprite.animations.play('walk', 3000, true);
		player.sprite.height = player.sprite.width = 36;
		player.sprite.anchor.setTo(.5, .5);
		player.speed = 300;

        player.score = game.add.text(10, 10, "Your score: ", style);
        player.score.fixedToCamera = true;

		player.setSize = function(size) {

			this.sprite.width = this.sprite.height = size;
		}

		player.getSize = function() {

			return this.sprite.width;
		}

        player.setScore = function(sc) {

            this.score.setText("Your score: " + sc);
        }

        player.getScore = function() {

            return this.score._text;
        }

		game.physics.p2.enable(player.sprite);
	    game.camera.follow(player.sprite);
	    cursors = game.input.keyboard.createCursorKeys();

	}


	function createEmiter() {

		emitters = new Array(
			game.add.emitter(300, 1684, 15),
			game.add.emitter(1200, 1684, 15),
			game.add.emitter(2700, 1684, 15)
		);
		
		for (var i = 0; i<3; i++) {

		    emitters[i].width = 30;
		    emitters[i].makeParticles('bubble');
		    emitters[i].setRotation(0, 0);
		    emitters[i].setAlpha(0.3, 0.8);
		    emitters[i].gravity = -30;
		    emitters[i].start(false, 9000, 15);
		
		}
	}


	socket.on('createFoodFromServer', function(data) {

		foods = new Array (
			game.add.sprite(data[0].x, data[0].y, 'food'),
			game.add.sprite(data[1].x, data[1].y, 'food'),
			game.add.sprite(data[2].x, data[2].y, 'food'),
			game.add.sprite(data[3].x, data[3].y, 'food'),
			game.add.sprite(data[4].x, data[4].y, 'food'),
			game.add.sprite(data[5].x, data[5].y, 'food'),
			game.add.sprite(data[6].x, data[6].y, 'food'),
			game.add.sprite(data[7].x, data[7].y, 'food'),
			game.add.sprite(data[8].x, data[8].y, 'food'),
			game.add.sprite(data[9].x, data[9].y, 'food')
		);
		console.log("Recive food");
	});


	socket.on('refreshFood', function(data) {

		console.log('relocate food');
		for(var i = 0; i < foods.length; i++) {
			foods[i].x = data[i].x;
			foods[i].y = data[i].y;
		}
	});


    socket.on('upScore', function(data) {

        player.setSize(data.size);
        player.setScore(data.score);
        player.speed = data.speed;
        console.log(player.score);
    });


    socket.on('lose', function(data) {

        if (data === (socket.id).toString().substr(0, 5)) {

            socket.disconnect();

           if(confirm(player.getScore() +'. Зіграти ще раз? ')) {
               location.reload();
           }
            else {
               document.body.innerHTML = "<h1 class='gameover'>Гру закінчено!</h1>";
           }
        }

    });

	function refresh() {
		socket.on('refresh', function(data) {

				for(var user in data) {

					var item = data[user];

					if(data[user].id === (socket.id).toString().substr(0, 5)) {
						continue;
					}

					if (data[user].id in otherPlayers) {

                        otherPlayers[item.id].sprite.height = data[user].size;
                        otherPlayers[item.id].sprite.width = data[user].size;
						otherPlayers[item.id].sprite.x = data[user].x;
						otherPlayers[item.id].sprite.y = data[user].y;
						otherPlayers[item.id].name.x = Math.floor( data[user].x);
						otherPlayers[item.id].name.y = Math.floor( data[user].y - data[user].size / 1.8);
                        otherPlayers[item.id].sprite.scale.x *= -1;
                        otherPlayers[item.id].speed = data[user].speed;

                        if (data[user].flip == 1)
                            otherPlayers[item.id].sprite.scale.x *= -1;
					}
					else
					{
						otherPlayers[item.id] = {};
						otherPlayers[item.id].id = data[user].id;
						otherPlayers[item.id].sprite = game.add.sprite(1500, 840, 'emeny');
						otherPlayers[item.id].sprite.height = data[user].size;
						otherPlayers[item.id].sprite.width = data[user].size;
						otherPlayers[item.id].sprite.anchor.setTo(.5, .5);
						otherPlayers[item.id].name = game.add.text(0, 0, data[user].name, nameStyle);
						otherPlayers[item.id].name.anchor.set(0.5);
					}
				}
		});
	}

	socket.on('playerDisconnect', function(data) {
		console.log("Player - "+data+" disconnected");
		otherPlayers[data].sprite.body = null;
		otherPlayers[data].sprite.destroy();
        otherPlayers[data].name.body = null;
        otherPlayers[data].name.destroy();
		delete otherPlayers[data];
	});


	function update () {
		
		player.sprite.body.setZeroVelocity();
		player.sprite.body.setZeroRotation();

	    if (cursors.up.isDown)
	    {
	    	sendMove();
	        player.sprite.body.moveUp(player.speed)
	    }
	    else if (cursors.down.isDown)
	    {
	    	sendMove();
	        player.sprite.body.moveDown(player.speed);
	    }

	    if (cursors.left.isDown)
	    {
	    	sendMove(1);
	        player.sprite.body.velocity.x = -player.speed;

            if (player.sprite.scale.x<0)
                player.sprite.scale.x *= -1;

	    }
	    else if (cursors.right.isDown)
	    {
	    	sendMove(2);
	        player.sprite.body.moveRight(player.speed);

            if (player.sprite.scale.x>0)
                player.sprite.scale.x *= -1;

	    }
	}


	function sendMove(flip) {
		
		socket.emit('move', {
			'x' : Math.round(player.sprite.body.x),
			'y' : Math.round(player.sprite.body.y),
            'flip': flip
			});
	}


	function getUserName() {
		var name = prompt('name', 'anonim');
		socket.emit("newPlayer", name);
	}

})();
