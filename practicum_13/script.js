const tasks = [
	{ text: "Finish chapter 3 of The Time Machine", done: false },
	{ text: "Write a review of Ink and Embers", done: true },
	{ text: "Read 20 pages of The War of the Worlds", done: false },
	{ text: "Add The Silent Archive to your shelf", done: false },
	{ text: "Choose your next book to read", done: false },
];

function showTasks() {
	const list = document.getElementById("taskList");
	list.innerHTML = "";
	for (let i = 0; i < tasks.length; i++) {
		const li = document.createElement("li");
		li.className = tasks[i].done ? "card task done" : "card task";
		const text = document.createElement("span");
		text.className = "task-text";
		text.textContent = tasks[i].text;
		const buttons = document.createElement("div");
		buttons.className = "task-buttons";
		buttons.appendChild(
			makeButton(tasks[i].done ? "Undo" : "Done", "toggleTask(" + i + ")"),
		);
		buttons.appendChild(makeButton("Edit", "editTask(" + i + ")"));
		buttons.appendChild(makeButton("Delete", "deleteTask(" + i + ")"));
		li.appendChild(text);
		li.appendChild(buttons);
		list.appendChild(li);
	}
	const finished = tasks.filter(function (t) {
		return t.done;
	}).length;
	document.getElementById("count").textContent =
		tasks.length === 0
			? "No tasks yet. Add one above."
			: finished + " of " + tasks.length + " tasks done";
}

function makeButton(label, action) {
	const btn = document.createElement("button");
	btn.className = "button";
	btn.textContent = label;
	btn.setAttribute("onclick", action);
	return btn;
}

function addTask() {
	const input = document.getElementById("taskInput");
	const message = document.getElementById("message");
	const text = input.value.trim();
	if (text === "") {
		message.textContent = "Please type a task first.";
		return;
	}
	tasks.push({ text: text, done: false });
	input.value = "";
	message.textContent = "";
	showTasks();
}

function toggleTask(index) {
	tasks[index].done = !tasks[index].done;
	showTasks();
}

function editTask(index) {
	const newText = prompt("Edit your task:", tasks[index].text);
	if (newText !== null && newText.trim() !== "") {
		tasks[index].text = newText.trim();
		showTasks();
	}
}

function deleteTask(index) {
	tasks.splice(index, 1);
	showTasks();
}

showTasks();
