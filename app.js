var scale = 50;		// symbols size
var spacing = 53;	// symbols size + space between

function Symbol(type, x, y, reel)
{
	this.type = type;		// each type has a different image
	this.x = x;				// x position
	this.y = y;				// y position
	this.reel = reel;		// which reel the symbol belong to
	this.speed = 0;			// s = v*t
	this.chosen = false;	// was it chosen by RNG?
	this.minTime = 0.0;		// minimum time spent spinning
	this.interval = 0.0;	// time counter
	this.finalPos = 0;		// where it should be after spinning
	this.lastPos = 0;		// position in previous frame
}

// called once per frame, before drawing on screen
Symbol.prototype.update = function(dt)
{
	if (this.speed > 0)
	{
		this.interval += dt;
		if (this.interval > this.minTime)
		{
			// stop only if it has just passed finalPos
			if (this.chosen && this.y >= spacing * this.finalPos && this.lastPos < spacing * this.finalPos)
			{
				this.chosen = false;
				this.stop();
				game.stopReel(this.reel); // stop everything in same reel
			}
		}
		this.lastPos = this.y;
			
		this.y += this.speed * dt;
		if (this.y > spacing * 10) this.y -= spacing * 10; // wrapping
	}
}

// draw on screen
Symbol.prototype.draw = function(context)
{
	context.drawImage(this.img, this.x, this.y, scale, scale);
};

// load the corresponding image based on type
Symbol.prototype.setImage = function(imagesrc)
{
	this.img = new Image();
	this.img.src = imagesrc[this.type];
};

// notify that it is the chosen one
Symbol.prototype.choose = function(time)
{
	this.chosen = true;
	this.minTime = time;
	this.interval = 0.0;
};

// stop spinning and adjust position
Symbol.prototype.stop = function()
{
	this.speed = 0;
	this.y = this.finalPos * spacing;
};


function Game()
{
	this.canvas = document.createElement("canvas");
	this.canvas.addEventListener("mousedown", spin, false);
	this.canvas.addEventListener("touchstart", spin, false);
	this.ctx = this.canvas.getContext("2d");
	document.body.appendChild(this.canvas);
	this.resize(); // resize the canvas and all the elements inside
	
	this.lastTS = 0;		// previous timestamp
	this.canSpin = true;	// stops spin commands
	
	this.imagesrc = [		// images sources
		"images/elephant.png",
		"images/giraffe.png",
		"images/hippo.png",
		"images/monkey.png",
		"images/panda.png",
		"images/parrot.png",
		"images/penguin.png",
		"images/pig.png",
		"images/rabbit.png",
		"images/snake.png",
	];
	
	this.jolly = 5; 	// this symbol can substitute any other one (parrot)
	
	this.paylines = [	// 25 winning lines
		[ 1, 1, 1, 1, 1 ],
        [ 0, 0, 0, 0, 0 ],
        [ 2, 2, 2, 2, 2 ],
        [ 0, 1, 2, 1, 0 ],
        [ 2, 1, 0, 1, 2 ],
        [ 0, 0, 1, 0, 0 ],
        [ 2, 2, 1, 2, 2 ],
        [ 1, 0, 0, 0, 1 ],
        [ 1, 2, 2, 2, 1 ],
        [ 1, 0, 1, 0, 1 ],
        [ 1, 2, 1, 2, 1 ],
        [ 0, 1, 0, 1, 0 ],
        [ 2, 1, 2, 1, 2 ],
        [ 1, 1, 0, 1, 1 ],
        [ 1, 1, 2, 1, 1 ],
        [ 0, 1, 1, 1, 0 ],
        [ 2, 1, 1, 1, 2 ],
        [ 0, 1, 2, 2, 2 ],
        [ 2, 1, 0, 0, 0 ],
        [ 0, 2, 0, 2, 0 ],
        [ 2, 0, 2, 0, 2 ],
        [ 1, 0, 2, 0, 1 ],
        [ 1, 2, 0, 2, 1 ],
        [ 0, 0, 1, 2, 2 ],
        [ 2, 2, 1, 0, 0 ]
    ];
	
	this.reels = [];
	for (var i = 0; i < 5; i++)
	{
		this.reels[i] = []
		for (var j = 0; j < 10; j++)
		{
			this.reels[i][j] = new Symbol(j, spacing * i, spacing * j, i);
		}
		shuffle(this.reels[i]); // randomizes order
	}
	
	// loading images
	var imagesrc = this.imagesrc;
	iterate(this.reels, function(symbol){
		symbol.setImage(imagesrc);
	});
	
	// this will store the symbols used to calculate the results (3x5)
	this.results = [];
	for (var i = 0; i < 3; i++)
		this.results[i] = [];
	
	this.lines = [];		// winning lines highlighter
	this.scoreText = "";	// to show the score after the spin
	
	this.music = new Audio("sounds/musicbox.ogg");		// music that will run while spinning
	this.music.volume = 0.5;
	this.music.load();
	
	this.reelstop = new Audio("sounds/reelstop.wav");	// sound effect when a reel stops
	this.reelstop.volume = 0.8;
	this.reelstop.load();
	
	this.winning = new Audio("sounds/winning.wav");		// sound effect when winning
	this.winning.volume = 1;
	this.winning.load();
}

// called once per frame
Game.prototype.update = function(timestamp)
{
	if (this.lastTS == 0)
	{
		this.lastTS = timestamp;
		return;
	}
	
	// delta time
	var dt = (timestamp - this.lastTS) / 1000.0;
	this.lastTS = timestamp;
	
	iterate(this.reels, function(symbol){
		symbol.update(dt);
	});
};

// draw stuff on screen
Game.prototype.draw = function()
{
	// clear the screen before drawing
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	var ctx = this.ctx;
	iterate(this.reels, function(symbol){
		symbol.draw(ctx);
	});
	
	// drawing winning lines (if any)
	this.ctx.lineWidth = 10;
	this.ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
	this.ctx.lineCap = "round";
	this.ctx.lineJoin = "round";
	for (var i = 0; i < this.lines.length; i++)
	{
		this.ctx.beginPath();
		this.ctx.moveTo(this.lines[i][0][0], this.lines[i][0][1]);
		for (var j = 1; j < this.lines[i].length; j++)
		{
			var point = this.lines[i][j];
			this.ctx.lineTo(point[0], point[1]);
		}
		this.ctx.stroke();
	}
	
	// drawing score text
	this.ctx.font = "italic 10pt Calibri";
	this.ctx.fillText(this.scoreText, spacing * 5 + 10, 3* spacing + 10);
};

// resizes the canvas and everything in it
Game.prototype.resize = function()
{
	// as big as the window
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	
	// scale and translate to only show the 3 rows used for the results
	var factor = this.canvas.height / (4 * spacing);
	this.ctx.scale(factor, factor);
	this.ctx.translate(spacing-scale, -2.5*spacing);
};

// starts a spin round
Game.prototype.spin = function()
{
	if (this.canSpin)
	{	
		this.lines = [];
		this.scoreText = "";
		this.canSpin = false;
		
		this.music.play();
		
		for (var i = 0; i < this.reels.length; i++)
		{
			// pick the top one
			var random = Math.floor(Math.random() * 10);
			
			for (var j = 0; j < this.reels[i].length; j++)
			{
				var position = j - random;
				position = position.mod(10);
				
				// stores the results
				if (position >= 0 && position <= 2)
				{
					this.results[position][i] = this.reels[i][j];
				}
				
				// set stop position and make them spin
				this.reels[i][j].finalPos = (position + 3).mod(10);
				this.reels[i][j].speed = 500;
				
				if (position == 1 && i == 0)
				{
					// the chosen one will notify the others to stop too
					this.reels[i][j].choose(1.0);
				}
				
			}
		}
	}
};

// stops a single reel
Game.prototype.stopReel = function(index)
{
	for (var i = 0; i < this.reels[index].length; i++)
	{
		this.reels[index][i].stop();
	}
	
	this.reelstop.play();
	
	// there are reels still spinning
	if (index < 4)
	{
		this.results[1][index+1].choose(1.0);
	}
	// last reel stopped, check the results
	else
	{
		// effectively stops a soundtrack
		this.music.pause();
		this.music.currentTime = 0;
		
		var score = 0;
		
		for (var i = 0; i < this.paylines.length; i++)
		{
			// checks how many symbols are in the correct position and correct order
			var symbol = this.results[this.paylines[i][0]][0];
			var j = 1;
			for (; j < this.paylines[i].length; j++)
			{
				var current = this.results[this.paylines[i][j]][j];
				
				if (symbol.type == this.jolly)
				{
					symbol = current;
				}
				else
				{
					if (current.type != symbol.type && current.type != this.jolly)
						break;
				}
			}
			
			// if 3 or more, draw a line and increase score
			if (j >= 3)
			{
				var line = [];
				for (var k = 0; k < this.paylines[i].length; k++)
				{
					var position = this.results[this.paylines[i][k]][k];
					var point = [];
					point[0] = position.x + scale / 2;
					point[1] = position.y + scale / 2;
					line.push(point);
				}
				this.lines.push(line);
				
				score += Math.pow(10, j);
			}
		}
		
		this.scoreText = "" + score;
		
		if (score > 0) this.winning.play();
		
		this.canSpin = true;
		
	}
};

// modulo operator
Number.prototype.mod = function(n)
{
	return ((this % n) + n) % n;
}

// Fisher-Yates shuffling algorithm
function shuffle(arr)
{
	for (var i = arr.length - 1; i > 0; i--)
	{
		var j = Math.floor(Math.random() * (i + 1));
		var temp = arr[j].type;
		arr[j].type = arr[i].type;
		arr[i].type = temp;
	}
}

// executes a function on each member of a 2d array
function iterate(arr, func)
{
	for (var i = 0; i < arr.length; i++)
	{
		for (var j = 0; j < arr[i].length; j++)
		{
			func(arr[i][j]);
		}
	}
}

function spin()
{
	game.spin();
}

function resize()
{
	game.resize();
}

function update(timestamp)
{
	game.update(timestamp);
	game.draw();
	window.requestAnimationFrame(update);
}

var game = new Game();
window.addEventListener("resize", resize, false);
window.addEventListener("orientationchange", resize, false);
window.requestAnimationFrame(update);