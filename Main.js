const page = document.body.dataset.page;
if (page === "login") {
    import("./Login.js");
}
if (page === "admin") {
    import("./admin.js");
}