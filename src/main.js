import "./style.css";
import * as game from "./game.js";

const elem_game = document.getElementById("game");
const elem_controls = document.getElementById("controls");

game.setContainer(elem_game);

//Events
document
	.getElementById("btn-restart")
	.addEventListener("click", game.restart);

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
	} else {
		elem_controls.className = "floating";

		elem_controls.style.left =
			document.body.offsetWidth * 0.5 + width * 0.5 + 8 + 2 + "px";
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
