import "./style.css";
import * as game from "./game.js";

const elem_game = document.getElementById("game");
const elem_controls = document.getElementById("controls");

const elem_score = document.getElementById("score");

const elem_game_over = document.getElementById("game-over-screen");
const elem_game_over_score = document.getElementById("go-score");

game.setContainer(elem_game);

function restart() {
	elem_game_over.style.display = "none";

	game.restart();
}

//Events
document.getElementById("btn-restart").addEventListener("click", restart);

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
		window.innerWidth - 20,
		window.innerHeight * 0.8,
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

window.addEventListener("resize", function () {
	if (!awaitingResize) {
		awaitingResize = true;

		requestAnimationFrame(resize);
	}
});

resize();
awaitingResize = true;
requestAnimationFrame(resize);
