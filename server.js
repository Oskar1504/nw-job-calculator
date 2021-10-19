const express = require('express');


const app = express();

app.use(express.static('pub'))

//start server at port 8080
let port = 8069
app.listen(port)

//debug to console
console.log(`\nServer started. http://localhost:${port}`);
