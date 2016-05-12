var scale = 50;
var spacing = 53;

function Symbol(type, x, y, reel)
{
	this.type = type;
	this.x = x;
	this.y = y;
	this.reel = reel;
	this.speed = 0;
	this.chosen = false;
	this.minTime = 0.0;
	this.interval = 0.0;
	this.finalPos = 0;
	this.lastPos = 0;
}

Symbol.prototype.update = function(dt)
{
	if (this.speed > 0)
	{
		this.interval += dt;
		if (this.interval > this.minTime)
		{
			if (this.chosen && this.y >= spacing * this.finalPos && this.lastPos < spacing * this.finalPos)
			{
				this.chosen = false;
				this.stop();
				game.stopReel(this.reel);
			}
		}
		this.lastPos = this.y;
			
		this.y += this.speed * dt;
		if (this.y > spacing * 10) this.y -= spacing * 10;
	}
}

Symbol.prototype.draw = function(context)
{
	context.drawImage(this.img, this.x, this.y, scale, scale);
};

Symbol.prototype.setImage = function(imagesrc)
{
	this.img = new Image();
	this.img.src = imagesrc[this.type];
};

Symbol.prototype.choose = function(time)
{
	this.chosen = true;
	this.minTime = time;
	this.interval = 0.0;
};

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
	this.resize();
	
	this.lastTS = 0;
	this.canSpin = true;
	
	this.imagesrc = [
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
	
	this.jolly = 5;
	
	this.paylines = [
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
		//shuffle(this.reels[i]);
	}
	
	var imagesrc = this.imagesrc;
	iterate(this.reels, function(symbol){
		symbol.setImage(imagesrc);
	});
	
	this.results = [];
	for (var i = 0; i < 3; i++)
		this.results[i] = [];
	
	this.lines = [];
}

Game.prototype.update = function(timestamp)
{
	if (this.lastTS == 0)
	{
		this.lastTS = timestamp;
		return;
	}
	
	var dt = (timestamp - this.lastTS) / 1000.0;
	this.lastTS = timestamp;
	
	iterate(this.reels, function(symbol){
		symbol.update(dt);
	});
};

Game.prototype.draw = function()
{
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	
	var ctx = this.ctx;
	iterate(this.reels, function(symbol){
		symbol.draw(ctx);
	});
	
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
};

Game.prototype.resize = function()
{
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	
	var factor = this.canvas.height / (4 * spacing);
	this.ctx.scale(factor, factor);
	this.ctx.translate(spacing-scale, -2.5*spacing);
};

Game.prototype.spin = function()
{
	if (this.canSpin)
	{
		this.lines = [];
		this.canSpin = false;
		
		for (var i = 0; i < this.reels.length; i++)
		{
			var random = Math.floor(Math.random() * 10);
			
			for (var j = 0; j < this.reels[i].length; j++)
			{
				var position = j - random;
				position = position.mod(10);
				
				if (position >= 0 && position <= 2)
				{
					this.results[position][i] = this.reels[i][j];
				}
				
				this.reels[i][j].finalPos = (position + 3).mod(10);
				this.reels[i][j].speed = 500;
				
				if (position == 1 && i == 0)
				{
					this.reels[i][j].choose(1.0);
				}
				
			}
		}
	}
};

Game.prototype.stopReel = function(index)
{
	for (var i = 0; i < this.reels[index].length; i++)
	{
		this.reels[index][i].stop();
	}
	
	if (index < 4)
	{
		this.results[1][index+1].choose(1.0);
	}
	else
	{
		var score = 0;
		
		for (var i = 0; i < this.paylines.length; i++)
		{
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
		
		console.log(score);
		
		this.canSpin = true;
		
	}
};


Number.prototype.mod = function(n)
{
	return ((this % n) + n) % n;
}

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