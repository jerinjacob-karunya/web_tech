const questions = [
	{
		question: "Who wrote The Time Machine?",
		options: ["H.G. Wells", "Jules Verne", "Mary Shelley", "Isaac Asimov"],
		answer: 0,
	},
	{
		question: "Which novel is about a Martian invasion of Earth?",
		options: ["Dracula", "Frankenstein", "The War of the Worlds", "Dune"],
		answer: 2,
	},
	{
		question: "Who wrote Pride and Prejudice?",
		options: [
			"Charlotte Bronte",
			"Jane Austen",
			"Virginia Woolf",
			"Emily Dickinson",
		],
		answer: 1,
	},
	{
		question: "Which former Indian President wrote Wings of Fire?",
		options: [
			"R.K. Narayan",
			"Rabindranath Tagore",
			"Chetan Bhagat",
			"A.P.J. Abdul Kalam",
		],
		answer: 3,
	},
	{
		question: "How many main books are in the Harry Potter series?",
		options: ["5", "6", "7", "8"],
		answer: 2,
	},
];

let current = 0;
let score = 0;
let answered = false;

function showQuestion() {
	const q = questions[current];
	answered = false;
	document.getElementById("progress").textContent =
		"Question " + (current + 1) + " of " + questions.length;
	document.getElementById("question").textContent = q.question;
	document.getElementById("feedback").textContent = "";
	document.getElementById("nextBtn").textContent =
		current === questions.length - 1 ? "Finish" : "Next";
	document.getElementById("nextBtn").style.display = "inline-block";
	document.getElementById("restartBtn").style.display = "none";
	const box = document.getElementById("options");
	box.innerHTML = "";
	for (let i = 0; i < q.options.length; i++) {
		const btn = document.createElement("button");
		btn.className = "option";
		btn.textContent = q.options[i];
		btn.onclick = function () {
			chooseAnswer(i);
		};
		box.appendChild(btn);
	}
}

function chooseAnswer(index) {
	if (answered) return;
	answered = true;
	const q = questions[current];
	const buttons = document.querySelectorAll(".option");
	if (index === q.answer) {
		score++;
		buttons[index].classList.add("correct");
		document.getElementById("feedback").textContent = "Correct!";
	} else {
		buttons[index].classList.add("wrong");
		buttons[q.answer].classList.add("correct");
		document.getElementById("feedback").textContent =
			"Not quite. The right answer is highlighted.";
	}
}

function nextQuestion() {
	if (!answered) {
		document.getElementById("feedback").textContent =
			"Please pick an answer first.";
		return;
	}
	current++;
	if (current < questions.length) {
		showQuestion();
	} else {
		showResult();
	}
}

function showResult() {
	document.getElementById("progress").textContent = "Quiz finished";
	document.getElementById("question").textContent =
		"You scored " + score + " out of " + questions.length;
	document.getElementById("options").innerHTML = "";
	document.getElementById("feedback").textContent =
		score >= 4 ? "Great reading!" : "Keep reading, you will get there.";
	document.getElementById("nextBtn").style.display = "none";
	document.getElementById("restartBtn").style.display = "inline-block";
}

function restartQuiz() {
	current = 0;
	score = 0;
	showQuestion();
}

showQuestion();
