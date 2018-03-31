const express = require("express");
const app = express();
const path = require("path");

const port = 3000;


app.use(express.static(path.join(__dirname)));


app.get("/", function(req, res) {
    res.sendFile("/index.html");
});

app.listen(port, function() {
    console.log("App running on port: " + port);
});