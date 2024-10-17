# Documentation Website

A simple documentation website for browsing API details.
This website enables users to try out the API endpoints via the browser. This *may* require a slight alteration to the server.js file. It certainly does if the API is running via Docker.

## Usage

1. **Download** or **clone** this repository:
   ```bash
   git clone https://github.com/rilhia/dataiku-test.git
   ```
2. Docker Setup: To run the server in Docker, you may need to modify server.js to enable CORS. Replace the following lines found at the beginning of the file:
  ```javascript
  const path = require('path');
  const express = require('express');
  const game = require('./game');

  const app = express();
  app.use(express.json()) // for parsing application/json
  app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
  app.set('port', 4000);
  ```
...with this code:
  ```javascript
  const path = require('path');
  const express = require('express');
  const cors = require('cors'); // Add this line
  const game = require('./game');

  const app = express();
  app.use(cors()); // Add this line to enable CORS for all routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('port', 4000);
  ```
3.	Install CORS: Make sure to install CORS in your Node.js environment to avoid issues:
  ```bash
  npm install cors
  ```
