import "./style.css";
import * as game from "./game.js";

const elem_game = document.getElementById("game");
const elem_controls = document.getElementById("controls");

const elem_score = document.getElementById("score");
const elem_high_score = document.getElementById("high-score");

let high_score = 0;

const elem_game_over = document.getElementById("game-over-screen");
const elem_game_over_score = document.getElementById("go-score");

const ratio = 3 / 5;

game.setContainer(elem_game);

function restart() {
	elem_game_over.style.display = "none";

	game.restart();
}

if (window.localStorage) {
	let saved = parseInt(window.localStorage.getItem("high-score"));

	if (saved && saved > 0 && isFinite(saved)) {
		high_score = saved;

		elem_high_score.textContent = "High Score: " + high_score;
	}
}

//Events
document.getElementById("btn-restart").addEventListener("click", restart);

game.on("score", function (event) {
	elem_score.textContent = "Score: " + event.score;

	if (event.score > high_score) {
		high_score = event.score;

		elem_high_score.textContent = "High Score: " + high_score;

		if (window.localStorage) {
			window.localStorage.setItem("high-score", high_score);
		}
	}
});

game.on("gameOver", function (event) {
	elem_game_over.style.display = "block";

	elem_game_over_score.textContent = "Score: " + event.score;
});

document
	.getElementById("btn-go-restart")
	.addEventListener("click", restart);

//Resize

let awaitingResize = false;

function resize() {
	awaitingResize = false;

	let width = Math.min(
		document.body.offsetWidth - 20,
		window.innerWidth - 20,
		(window.innerHeight - 20) * ratio,
		500
	);

	game.setWidth(width);

	if (window.innerWidth < 900) {
		elem_controls.className = "below";

		elem_controls.style.width = width + 4 + "px";

		elem_controls.style.left = "";
	} else {
		elem_controls.className = "floating";

		elem_controls.style.left =
			document.body.offsetWidth * 0.5 + width * 0.5 + 8 + 2 + "px";

		elem_controls.style.width = "";
	}
}

function delayedResize() {
	if (!awaitingResize) {
		awaitingResize = true;

		requestAnimationFrame(resize);
	}
}

window.addEventListener("resize", function () {
	if (!awaitingResize) {
		awaitingResize = true;

		requestAnimationFrame(resize);

		this.setTimeout(delayedResize, 500);
	}
});

resize();
awaitingResize = true;
requestAnimationFrame(resize);
