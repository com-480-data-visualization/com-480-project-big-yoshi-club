"use strict";

// Imports
const express = require('express')
const path = require('path')

// Instantiate app and choose port
const app = express()
const port = 3000

// Setup routing
app.use('/html', express.static('html'))
app.use('/js', express.static('js'))
app.use('/css', express.static('css'))
app.use('/img', express.static('img'))
app.use('/data', express.static('data'))

// Serve main HTML file
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'html', 'index.html'))
})

// Start listening for requests
app.listen(port, () => console.log(`Website listening at http://localhost:${port}`))