const API_URL = "https://openlibrary.org/search.json";

let shelf = [];

function setStatus(message, isError) {
	const status = document.getElementById("status");
	status.textContent = message;
	status.className = isError ? "subtxt error-text" : "subtxt";
}

function setDebug(message) {
	document.getElementById("debug").textContent = message;
}

async function searchBooks() {
	const query = document.querySelector("#searchInput").value.trim();
	if (query === "") {
		setStatus("Please type a book title or an author.", true);
		return;
	}
	if (query.length < 2) {
		setStatus("Please type at least 2 letters.", true);
		return;
	}
	const url =
		API_URL +
		"?q=" +
		encodeURIComponent(query) +
		"&limit=8&fields=key,title,author_name,first_publish_year,cover_i";
	console.log("Request:", url);
	setStatus("Searching...", false);
	setDebug("Request: " + url);
	document.getElementById("results").innerHTML = "";
	try {
		const response = await fetch(url);
		console.log("Status:", response.status);
		setDebug("Request: " + url + "  |  Status: " + response.status);
		if (!response.ok) {
			throw new Error("The server replied with status " + response.status);
		}
		const data = await response.json();
		console.log("Data received:", data);
		showResults(data.docs);
	} catch (error) {
		console.error("Search failed:", error);
		setStatus(
			"Could not load books. Check your internet connection and try again. (" +
				error.message +
				")",
			true,
		);
	}
}

function showResults(books) {
	const box = document.getElementById("results");
	box.className = "";
	box.innerHTML = "";
	if (!books || books.length === 0) {
		setStatus("No books found. Try another title or author.", false);
		return;
	}
	setStatus(books.length + " books found.", false);
	box.className = "grid";
	books.forEach(function (book) {
		const card = document.createElement("div");
		card.className = "card book";
		if (book.cover_i) {
			const img = document.createElement("img");
			img.src =
				"https://covers.openlibrary.org/b/id/" + book.cover_i + "-M.jpg";
			img.alt = "Cover of " + book.title;
			img.loading = "lazy";
			card.appendChild(img);
		} else {
			const noCover = document.createElement("div");
			noCover.className = "no-cover";
			noCover.textContent = "No cover";
			card.appendChild(noCover);
		}
		const title = document.createElement("p");
		title.className = "subsec";
		title.textContent = book.title;
		const info = document.createElement("p");
		info.className = "subtxt small";
		const author = book.author_name ? book.author_name[0] : "Unknown author";
		const year = book.first_publish_year
			? book.first_publish_year
			: "year unknown";
		info.textContent = author + " - " + year;
		const addBtn = document.createElement("button");
		addBtn.className = "button main-button";
		addBtn.textContent = "Add to shelf";
		addBtn.onclick = function () {
			addToShelf(book.key, book.title, author);
		};
		card.appendChild(title);
		card.appendChild(info);
		card.appendChild(addBtn);
		box.appendChild(card);
	});
}

function addToShelf(key, title, author) {
	for (let i = 0; i < shelf.length; i++) {
		if (shelf[i].key === key) {
			setStatus(title + " is already on your shelf.", true);
			return;
		}
	}
	shelf.push({ key: key, title: title, author: author });
	setStatus(title + " added to your shelf.", false);
	showShelf();
}

function removeFromShelf(index) {
	shelf.splice(index, 1);
	showShelf();
}

function showShelf() {
	const list = document.getElementById("shelfList");
	list.innerHTML = "";
	for (let i = 0; i < shelf.length; i++) {
		const li = document.createElement("li");
		li.className = "card shelf-item";
		const text = document.createElement("span");
		text.textContent = shelf[i].title + " - " + shelf[i].author;
		const removeBtn = document.createElement("button");
		removeBtn.className = "button";
		removeBtn.textContent = "Remove";
		removeBtn.onclick = function () {
			removeFromShelf(i);
		};
		li.appendChild(text);
		li.appendChild(removeBtn);
		list.appendChild(li);
	}
	document.getElementById("shelfCount").textContent =
		shelf.length === 0
			? "Your shelf is empty. Search for a book and add it."
			: shelf.length + " book(s) on your shelf";
}

showShelf();
