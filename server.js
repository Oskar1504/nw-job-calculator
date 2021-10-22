const express = require('express');

const app = express();

app.use(express.static('pub'))

let port = 8069
app.listen(port)

//debug to console
console.log(`\nServer started. http://localhost:${port}`);
