let seconds = 0;
let timerId = null;

function pad(number) {
	return number < 10 ? "0" + number : number;
}

function updateClock() {
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	document.querySelector("#clock").textContent = pad(minutes) + ":" + pad(secs);
}

function startTimer() {
	if (timerId !== null) return;
	timerId = setInterval(function () {
		seconds++;
		updateClock();
	}, 1000);
	document.querySelector("#timerStatus").textContent = "Reading in progress...";
}

function stopTimer() {
	clearInterval(timerId);
	timerId = null;
	document.querySelector("#timerStatus").textContent =
		"Paused at " + document.querySelector("#clock").textContent;
}

function resetTimer() {
	stopTimer();
	seconds = 0;
	updateClock();
	document.querySelector("#timerStatus").textContent =
		"Press Start when you begin reading.";
}

let reminderId = null;

function setReminder() {
	const message = document.querySelector("#reminderMsg");
	const delay = Number(document.querySelector("#delaySelect").value);
	clearTimeout(reminderId);
	message.classList.remove("alert");
	message.textContent =
		"Reminder set. It will appear in " + delay + " seconds.";
	reminderId = setTimeout(function () {
		message.textContent = "Time to rest your eyes and stretch!";
		message.classList.add("alert");
		reminderId = null;
	}, delay * 1000);
}

function cancelReminder() {
	const message = document.querySelector("#reminderMsg");
	clearTimeout(reminderId);
	reminderId = null;
	message.classList.remove("alert");
	message.textContent = "Reminder cancelled.";
}

const books = {
	war: {
		title: "The War of the Worlds",
		meta: "H.G. Wells - Science fiction",
		text: "Strange cylinders fall from the sky and an invasion begins. A classic of visionary sci-fi.",
	},
	time: {
		title: "The Time Machine",
		meta: "H.G. Wells - Science fiction",
		text: "A scientist travels far into the future and discovers what has become of humanity.",
	},
	map: {
		title: "The Cartographer's Daughter",
		meta: "Mystery",
		text: "A warm, clever mystery about maps that do not match the land.",
	},
	ink: {
		title: "Ink and Embers",
		meta: "Historical fiction",
		text: "A slow-burn story of printers, letters and a fire that changed a town.",
	},
};

function showBook() {
	const book = books[document.querySelector("#bookSelect").value];
	document.querySelector("#bookTitle").textContent = book.title;
	document.querySelector("#bookMeta").textContent = book.meta;
	document.querySelector("#bookText").textContent = book.text;
}

function changeTextSize() {
	const size = document.querySelector("#sizeRange").value;
	document.querySelector("#bookText").style.fontSize = size + "px";
}

document.querySelector("#bookSelect").addEventListener("change", showBook);
document.querySelector("#sizeRange").addEventListener("input", changeTextSize);

showBook();
changeTextSize();
updateClock();
