var canvas;
var ctx;
var W, H;
var masses;
var isMouseDown;
var mouseX, mouseY;

var FPS = 60;
var G = 100;
var WALL_DAMP = 0.5;
var GRAVITY_DAMP = 0.1;
var MOUSE_POWER = 30000;
var NBALLS = 200;
var PHI_CONJ = 0.618033988749895;
var VI_RANGE = 100;

$(function() {
	// init
	W = document.body.clientWidth;
	H = document.body.clientHeight;
	var jcan = $('#canvas');
	canvas = jcan[0];
	ctx = canvas.getContext('2d');
	jcan.attr('width', W);
	jcan.attr('height', H);
	jcan.css('width', W);
	jcan.css('height', H);

	mouseX = W / 2;
	mouseY = H / 2;
	isMouseDown = false;
	jcan.on('mousedown', function(e) {
		e.preventDefault();
		isMouseDown = true;
		mouseX = e.pageX;
		mouseY = e.pageY;
	});
	jcan.on('touchstart', function(e) {
		e.preventDefault();
		isMouseDown = true;
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		mouseX = touch.pageX;
		mouseY = touch.pageY;
	})

	jcan.on('mouseup touchend', function(e) {
		e.preventDefault();
		isMouseDown = false;
	});

	jcan.on('mousemove', function(e) {
		e.preventDefault();
		mouseX = e.pageX;
		mouseY = e.pageY;
	});
	jcan.on('touchmove', function(e) {
		e.preventDefault();
		var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		mouseX = touch.pageX;
		mouseY = touch.pageY;
	});

	setup();
	runID = setInterval(run, 1000 / FPS);
});

function setup() {
	masses = [];

	var h = Math.random();
	for (var i = 0; i < NBALLS; i++) {
		h += PHI_CONJ;
		h %= 1;
		var mass = {
			x: Math.random() * W,
			y: Math.random() * H,
			m: 10 + Math.random() * 100,
			vx: (Math.random() * 2 - 1) * VI_RANGE / FPS,
			vy: (Math.random() * 2 - 1) * VI_RANGE / FPS,
			real: true,
			color: hsv2rgb(h, 0.5, 0.95)
		};
		masses.push(mass);
	}
	masses.push({
		x: 0,
		y: 0,
		m: 0,
		vx: 0,
		vy: 0,
		real: false
	}); // dumby mass for when mouse pressed
}

function run() {
	ctx.clearRect(0, 0, W, H);
	var comb = [];
	masses.forEach(function(mass, i) {
		// console.log(x);

		masses.forEach(function(other, j) {
			if (mass.m != 0 && (i != j)) {
				var accel = gforce(mass, other) / mass.m;
				var direc = dir(mass, other);
				mass.vx += direc.x * accel;
				mass.vy += direc.y * accel;
			}
		});

		if (mass.x < 0 || mass.x > W) {
			mass.vx = -mass.vx;
			mass.vx = sign(mass.vx) * (Math.pow(Math.abs(mass.vx), WALL_DAMP));
			mass.vy = sign(mass.vy) * (Math.pow(Math.abs(mass.vy), WALL_DAMP));
			if (mass.x < 0) {
				mass.x = 0;
			}
			else {
				mass.x = W;
			}
		}
		if (mass.y < 0 || mass.y > H) {
			mass.vy = -mass.vy;
			mass.vx = sign(mass.vx) * (Math.pow(Math.abs(mass.vx), WALL_DAMP));
			mass.vy = sign(mass.vy) * (Math.pow(Math.abs(mass.vy), WALL_DAMP));
			if (mass.y < 0) {
				mass.y = 0;
			}
			else {
				mass.y = H;
			}
		}

		mass.x += mass.vx;
		mass.y += mass.vy;

		if (isMouseDown) {
			masses[NBALLS] = {
				x: mouseX,
				y: mouseY,
				m: MOUSE_POWER,
				vx: 0,
				vy: 0,
				real: false
			};
		}
		else {
			masses[NBALLS].m = 0;
		}

		if (mass.m != 0 && mass.real) {
			fillCircle(mass.x, mass.y, Math.pow(mass.m, 1.0 / 3), mass.color);
		}
	});
	
	// draw CM
	var cm = centerofmass();
	drawCircle(cm.x, cm.y, 10, 'white');
}

function drawCircle(x, y, r, color) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.arc(Math.floor(x), Math.floor(y), r, 0, 2 * Math.PI, false);
	ctx.stroke();
	ctx.closePath();
}

function fillCircle(x, y, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(Math.floor(x), Math.floor(y), r, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.closePath();
}

function centerofmass() {
	var ret = {
		x: 0,
		y: 0,
		m: 0
	}
	masses.forEach(function(mass) {
		if (mass.real) {
			ret.x += mass.x * mass.m;
			ret.y += mass.y * mass.m;
			ret.m += mass.m;
		}
	});
	ret.x /= ret.m;
	ret.y /= ret.m;
	return ret;
}

function sign(x) {
	if (x == 0) {
		return 0;
	}
	return x > 0 ? 1 : -1;
}

function randomsign() {
	return Math.random() < 0.5 ? -1 : 1;
}

function gforce(a, b) {
	// Newton's law of universal gravitation, dampened
	return (G / FPS) * a.m * b.m / (Math.pow(H + W, 2) * GRAVITY_DAMP + (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

function dir(a, b) {
	// returns unit vector in direction of a -> b
	var d = Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y))
	return {
		x: (b.x - a.x) / d,
		y: (b.y - a.y) / d
	};
}

// copyright at https://gist.github.com/schinckel/1588489#file-hsv2rgb-js
function hsv2rgb(h, s, v) {
	var rgb, i, data = [];
	if (s === 0) {
		rgb = [v, v, v];
	} else {
		h = h * 6;
		i = Math.floor(h);
		data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
		switch(i) {
			case 0:
				rgb = [v, data[2], data[0]];
				break;
			case 1:
				rgb = [data[1], v, data[0]];
				break;
			case 2:
				rgb = [data[0], v, data[2]];
				break;
			case 3:
				rgb = [data[0], data[1], v];
				break;
			case 4:
				rgb = [data[2], data[0], v];
				break;
			default:
				rgb = [v, data[0], data[1]];
				break;
		}
	}
	return '#' + rgb.map(function(x){ 
		return ('0' + Math.round(x*255).toString(16)).slice(-2);
	}).join('');
}