import "./style.css";
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const correctUsername = "admin";
    const correctPassword = "1234";
    if (username === correctPassword && password === correctPassword) {
        errorMessage.textContent = "";
        alert("Inloggad!");
        localStorage.setItem("isLoggedIn", "true");
    } else {
        errorMessage.textContent = "Fel användarnamn eller lösenord";
    }
});
if (localStorage.getItem("isLoggedIn")!== "true") {
    window.location.href = "/";
}