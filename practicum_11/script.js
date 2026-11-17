function isEmpty(value) {
	return value.trim() === "";}

function isNumber(value) {
	return /^[0-9]+(\.[0-9]+)?$/.test(value.trim());}

function isWholeNumber(value) {
	return /^[0-9]+$/.test(value.trim());}

function isLettersOnly(value) {
	return /^[A-Za-z ]+$/.test(value.trim());}

function showError(id, message) {
	document.getElementById(id + "Error").textContent = message;	document.getElementById(id).classList.add("invalid");}

function clearError(id) {
	document.getElementById(id + "Error").textContent = "";	document.getElementById(id).classList.remove("invalid");}

function calculateBill(event) {
	event.preventDefault();
	const name = document.getElementById("custName").value;	const price = document.getElementById("price").value;	const qty = document.getElementById("qty").value;	const discountPercent = Number(document.getElementById("plan").value);
	clearError("custName");	clearError("price");	clearError("qty");
	let valid = true;	let firstBad = null;
	if (isEmpty(name)) {		showError("custName", "Please enter your name.");		valid = false;		firstBad = firstBad || "custName";	} else if (!isLettersOnly(name)) {		showError("custName", "Use letters only.");		valid = false;		firstBad = firstBad || "custName";	}
	if (isEmpty(price)) {		showError("price", "Please enter the price.");		valid = false;		firstBad = firstBad || "price";	} else if (!isNumber(price)) {		showError("price", "Enter numbers only, for example 250 or 199.50.");		valid = false;		firstBad = firstBad || "price";	} else if (Number(price) <= 0) {		showError("price", "Price must be more than 0.");		valid = false;		firstBad = firstBad || "price";	}
	if (isEmpty(qty)) {		showError("qty", "Please enter how many books.");		valid = false;		firstBad = firstBad || "qty";	} else if (!isWholeNumber(qty)) {		showError("qty", "Enter a whole number, for example 3.");		valid = false;		firstBad = firstBad || "qty";	} else if (Number(qty) < 1 || Number(qty) > 100) {		showError("qty", "Choose between 1 and 100 books.");		valid = false;		firstBad = firstBad || "qty";	}
	if (!valid) {		hideBill();		document.getElementById(firstBad).focus();		return;	}
	const subtotal = Number(price) * Number(qty);	const discount = Math.round(subtotal * discountPercent) / 100;	const afterDiscount = subtotal - discount;	let delivery = 40;
	if (afterDiscount >= 500) {		delivery = 0;	}
	const total = afterDiscount + delivery;	showBill(name.trim(), qty.trim(), price.trim(), subtotal, discountPercent, discount, delivery, total);}

function money(amount) {
	return "\u20B9" + amount.toFixed(2);}

function showBill(name, qty, price, subtotal, discountPercent, discount, delivery, total) {
	document.getElementById("outName").textContent = name;	document.getElementById("outItems").textContent = qty + " x \u20B9" + Number(price).toFixed(2);	document.getElementById("outSubtotal").textContent = money(subtotal);	document.getElementById("outDiscountLabel").textContent = "Discount (" + discountPercent + "%)";	document.getElementById("outDiscount").textContent = "- " + money(discount);	document.getElementById("outDelivery").textContent = delivery === 0 ? "Free" : money(delivery);	document.getElementById("outTotal").textContent = money(total);
	document.getElementById("billHint").classList.add("hidden");	document.getElementById("billTable").classList.remove("hidden");	document.getElementById("billNote").classList.remove("hidden");}

function hideBill() {
	document.getElementById("billHint").classList.remove("hidden");	document.getElementById("billTable").classList.add("hidden");	document.getElementById("billNote").classList.add("hidden");}

function clearForm() {
	document.getElementById("billForm").reset();	clearError("custName");	clearError("price");	clearError("qty");	hideBill();}
