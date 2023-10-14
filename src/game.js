import Matter from "matter-js";

// module aliases
const Engine = Matter.Engine,
	Bodies = Matter.Bodies,
	Body = Matter.Body,
	Bounds = Matter.Bounds,
	Events = Matter.Events,
	Composite = Matter.Composite;

const pi = Math.PI;
const twopi = Math.PI * 2;

//Rendering variables
const pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;

const line_dash = [10 * pixelRatio, 20 * pixelRatio];
const no_line_dash = [];

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let screen_width = 400;
let screen_height = 600;
let screen_scale = 0;

//Physics variables
let width = 300;
let height = 500;

const wall_thickness = 20;

const engine = Engine.create();
const ground = Bodies.rectangle(
	width * 0.5,
	height + wall_thickness * 0.5,
	width,
	wall_thickness,
	{
		isStatic: true,
	}
);
const wall_left = Bodies.rectangle(
	-wall_thickness * 0.5,
	0,
	wall_thickness,
	height * 2,
	{
		isStatic: true,
	}
);
const wall_right = Bodies.rectangle(
	width + wall_thickness * 0.5,
	0,
	wall_thickness,
	height * 2,
	{
		isStatic: true,
	}
);

//Game variables
const circles = [];

const circle_pool = [];

const boundary = 20;
const boundaryTime = 1000 * 3;

let paused = false;

let boundaryMax = 0;

const colors = [
	"#FFADAD",
	"#FFD6A5",
	//"#FDFFB6",
	"#CAFFBF",
	"#9BF6FF",
	"#A0C4FF",
	"#BDB2FF",
	"#FFC6FF",
];

const preview = {
	x: width * 0.5,
	y: 10,
	value: 0,
	text: "",
	color: "",

	next: 0,
};

//Time / Rendering variables
let at = Date.now();
let t = 0;
let d = 0;
let ld = 0;

let hasMerged = false;

let needsResize = false;

function getCircleRadius(value) {
	return Math.min(10 + value * 7.5 + value ** 2 * 0.2, width * 0.5 - 10);
}
function getCircleColor(value) {
	if (value <= 1) {
		return "#FAF0E6";
	}

	return colors[(value - 2) % colors.length];
}

function setBodyScale(circle) {
	Bounds.update(circle.body.bounds, circle.body.vertices);

	let scale =
		(circle.radius * 2) /
		(circle.body.bounds.max.x - circle.body.bounds.min.x);

	Body.scale(circle.body, scale, scale);
}

function addCircle(value, x, y) {
	if (circle_pool.length > 0) {
		let recycled = circle_pool.pop();

		recycled.value = value;
		recycled.text = 2 ** value;
		recycled.radius = getCircleRadius(value);
		recycled.color = getCircleColor(value);

		recycled.boundaryTimer = 0;

		Body.set(recycled.body, {
			position: {
				x: x,
				y: y,
			},

			angle: 0,
			angularVelocity: 0,
			speed: 0,
			velocity: { x: 0, y: 0 },
		});

		circles.push(recycled);
	} else {
		circles.push({
			value: value,

			text: 2 ** value,

			radius: getCircleRadius(value),

			color: getCircleColor(value),

			body: Bodies.circle(x, y, 100, {}, 36),

			boundaryTimer: 0,
		});

		circles[circles.length - 1].body.__circle =
			circles[circles.length - 1];
	}

	setBodyScale(circles[circles.length - 1]);

	Composite.add(engine.world, [circles[circles.length - 1].body]);
}

function remove(circle) {
	Composite.remove(engine.world, circle.body);

	circle_pool.push(circle);

	circles.splice(circles.indexOf(circle), 1);
}

function merge(circleA, circleB) {
	Body.setPosition(circleA.body, {
		x: (circleA.body.position.x + circleB.body.position.x) * 0.5,
		y: (circleA.body.position.y + circleB.body.position.y) * 0.5,
	});

	circleA.value += 1;
	circleA.text = 2 ** circleA.value;
	circleA.radius = getCircleRadius(circleA.value);
	circleA.color = getCircleColor(circleA.value);

	Body.scale(
		circleA.body,
		circleA.radius / circleB.radius,
		circleA.radius / circleB.radius
	);

	remove(circleB);
}

function render() {
	d = Date.now() - at;
	t += d;
	at += d;

	if (needsResize) {
		resize();
	}

	requestAnimationFrame(render);

	hasMerged = false;

	if (!paused) {
		Engine.update(engine, d, d / ld);
	}

	ctx.clearRect(
		0,
		0,
		screen_width * pixelRatio,
		screen_height * pixelRatio
	);

	ctx.lineWidth = 2 * pixelRatio;
	ctx.strokeStyle = "rgba(0,0,0, 0.2)";

	boundaryMax = 0;

	for (let i = 0; i < circles.length; i++) {
		if (circles[i].body.position.y - circles[i].radius < boundary) {
			circles[i].boundaryTimer += d;

			boundaryMax = Math.max(circles[i].boundaryTimer, boundaryMax);
		} else {
			circles[i].boundaryTimer = 0;
		}

		ctx.translate(
			circles[i].body.position.x * screen_scale * pixelRatio,
			circles[i].body.position.y * screen_scale * pixelRatio
		);

		ctx.rotate(circles[i].body.angle);

		ctx.beginPath();

		ctx.fillStyle = circles[i].color;

		ctx.arc(0, 0, circles[i].radius * screen_scale * pixelRatio, 0, twopi);

		ctx.fill();
		ctx.stroke();

		ctx.fillStyle = "rgba(0, 0, 0, 0.35)";

		ctx.font =
			"bold  " +
			Math.min(circles[i].radius * 1.2, 25) * pixelRatio +
			"px 'Asap', sans-serif";

		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(circles[i].text, 0, 0);

		ctx.resetTransform();
	}

	ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
	ctx.setLineDash(line_dash);

	ctx.beginPath();
	ctx.moveTo(
		preview.x * screen_scale * pixelRatio,
		((preview.y + preview.radius) * screen_scale + 10) * pixelRatio
	);
	ctx.lineTo(
		preview.x * screen_scale * pixelRatio,
		screen_height * pixelRatio
	);

	ctx.stroke();

	//Draw boundary
	ctx.globalAlpha = Math.max(0.1, boundaryMax / (boundaryTime * 0.75));

	ctx.fillStyle = "rgba(255, 173, 173, 0.3)";
	ctx.strokeStyle = "#FFADAD";

	ctx.beginPath();
	ctx.moveTo(0, boundary * screen_scale * pixelRatio);
	ctx.lineTo(
		screen_width * pixelRatio,
		boundary * screen_scale * pixelRatio
	);
	ctx.stroke();
	ctx.lineTo(screen_width * pixelRatio, 0);
	ctx.lineTo(0, 0);
	ctx.fill();

	ctx.setLineDash(no_line_dash);

	//Draw preview
	ctx.globalAlpha = 0.7;
	ctx.beginPath();
	ctx.fillStyle = preview.color;

	ctx.arc(
		preview.x * screen_scale * pixelRatio,
		preview.y * screen_scale * pixelRatio,
		preview.radius * screen_scale * pixelRatio,
		0,
		twopi
	);

	ctx.fill();
	ctx.stroke();

	ctx.fillStyle = "rgba(0, 0, 0, 0.35)";

	ctx.font =
		"bold  " +
		Math.min(preview.radius * 1.2, 25) * pixelRatio +
		"px 'Asap', sans-serif";

	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(
		preview.text,
		preview.x * screen_scale * pixelRatio,
		preview.y * screen_scale * pixelRatio
	);

	ctx.globalAlpha = 1;

	if (boundaryMax >= boundaryTime && !paused) {
		gameOver();
	}

	ld = d;
}

function gameOver() {
	paused = true;

	let score = 0;

	for (let i = 0; i < circles.length; i++) {
		score += 2 ** circles[i].value;
	}

	emit("gameOver", {
		score: score,
		circles: circles.length,
	});
}

function resize() {
	needsResize = false;

	screen_height = screen_width / (width / height);

	screen_scale = screen_width / width;

	canvas.width = screen_width * pixelRatio;
	canvas.height = screen_height * pixelRatio;

	canvas.style.width = screen_width + "px";
	canvas.style.height = screen_height + "px";
}

function onPointerClick() {
	if (paused) return;

	addCircle(preview.value, preview.x, 0);

	updatePreview();
}

function updatePreview() {
	preview.value = preview.next;

	preview.text = 2 ** preview.value;

	preview.radius = getCircleRadius(preview.value);

	preview.color = getCircleColor(preview.value);

	preview.next = Math.floor(Math.random() * 4);
}

function onPointerMove(event) {
	if (!paused) {
		preview.x = (event.offsetX / screen_width) * width;
	}
}

Composite.add(engine.world, [ground, wall_left, wall_right]);

//Listen to events...
function onCollide(event) {
	if (hasMerged) return;
	for (let i = 0; i < event.pairs.length; i++) {
		if (hasMerged) return;

		if (event.pairs[i].bodyA.__circle && event.pairs[i].bodyB.__circle) {
			if (
				event.pairs[i].bodyA.__circle.value ===
				event.pairs[i].bodyB.__circle.value
			) {
				hasMerged = true;

				merge(
					event.pairs[i].bodyA.__circle,
					event.pairs[i].bodyB.__circle
				);

				break;
			}
		}
	}
}
Events.on(engine, "collisionStart", onCollide);
Events.on(engine, "collisionActive", onCollide);

canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", function (e) {
	onPointerMove(e);
	onPointerClick(e);
});

//START...

resize();
updatePreview();

requestAnimationFrame(function () {
	d = Date.now() - at;
	t += d;
	at += d;

	ld = d;

	requestAnimationFrame(render);
});

function setContainer(element) {
	element.appendChild(canvas);
}

function setWidth(width) {
	screen_width = width;

	needsResize = true;
}

function restart() {
	while (circles.length > 0) {
		remove(circles[0]);
	}

	paused = false;
}

const listeners = {};

function on(eventName, listener) {
	if (!listeners.hasOwnProperty(eventName)) {
		listeners[eventName] = [];
	}

	listeners[eventName].push(listener);
}

function emit(eventName, event) {
	if (!listeners.hasOwnProperty(eventName)) {
		return;
	}

	for (let i = 0; i < listeners[eventName].length; i++) {
		listeners[eventName][i](event);
	}
}

export { setContainer, setWidth, restart, on };
