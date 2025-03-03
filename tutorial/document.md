# Taming a Top Trumps API: Turning a Quirky API into a Game for Old School Players
![Title](images/TopTrumpsTitle.webp)

Recently I have been tasked with writing API documentation for a game based on the classic Top Trumps card game...I may be showing my age with that enthusiastic reference. At the weekend, I went away with some friends and ended up playing a Pokémon trading card game with my mate's little boy Charlie. There were some surprising similarities between the API game and the game I played with Charlie. Like the API game, Charlie's game didn't have a set "win" state, Charlie's cards never seemed to run out and absolutely on par with the API game, Charlie's game didn't end unless he won. While playing by a child's idea of how the rules of the game should work (incidentally....Charlie always wins) can be endearing, I thought that the API game could be improved. So I decided to do this and put this tutorial together to show you how.

The Game API
The Game API can be found on GitHub here https://github.com/dataiku/DA-technical-test. I won’t go over how to install it and run it, since this is covered in the documentation there. But if you want to try out what is covered in this tutorial, you will need to have a copy of this.

### Issues with the Game
I briefly touched upon the issues with the game, but here is a more thorough explanation.

- **No "win" state**: Both the player and the computer can endlessly “buy cards”, meaning the game never ends.
- **No card counting for the computer**: The computer’s cards are randomly generated each round.
- **No visibility of the computer's card**: The API is unable to return the computer’s card outside of the "battle" state. Not immediately obvious as a problem, but we will talk about this later.
- **Computer cannot initiate turns**: Only the player picks card attributes to initiate rounds.
- **PlayerID is easily lost**: API calls require playerID, and records aren’t stored.
- **Manual API calls only**: The game is currently played by manually calling APIs.


### The purpose of this tutorial
In this tutorial we will produce a user interface to this API and will attempt to fix the issues mentioned above. The game will be able to be played by anyone who can use a webpage. It will be turn based, in that both the player and the computer will be able to initiate a round (or pick the card attribute to compete with). Player data will be stored between sessions of the game without the user needing to remember anything but their username. There will be a “win” state, when the player or the computer has 14 cards. The computer still won’t be able to see it’s card prior to the battle state, but a mechanism will be put in place to ensure that the computer is able to be competitive. This will be a basic method which actually will benefit the computer more than the player, but this can be modified and I’ll be interested to hear your methods for this…I have a few in mind already.

Now before I continue on into an overly verbose description of what we’re doing, let’s begin.

### The API Client
Now, this is an API game. You could go about playing this by manually calling the API endpoints, but that would be terribly fiddly and I’ll be honest, the game isn’t that exciting that it would be worth the effort. You could also write the code to interact with the endpoints yourself…it’s not that difficult. But I have put together a simple “client” you can use to make this easier. This can be seen below (calling it a “client” is a bit of a stretch, but indulge me for this)…
```javascript

        // Set the Base URL for API calls        
        const baseUrl = 'http://localhost:4000';

        // Sends a GET request to check the status of the cards endpoint
        async function ping() {
            const url = `${baseUrl}/cards`;
            const headers = { 'Content-Type': 'application/json' };
            return fetchData(url, 'GET', headers, null);
        }

        // Registers a new user with a given username, birthdate, and email
        async function register(username, birthdate, email) {
            const url = `${baseUrl}/register`;
            const headers = { 'Content-Type': 'application/json' };
            const requestBody = { username, birthdate, email };
            return fetchData(url, 'POST', headers, requestBody);
        }

        // Retrieves the profile data of a player based on their playerId
        async function profile(playerId) {
            const url = `${baseUrl}/profile`;
            const headers = { 'Content-Type': 'application/json', 'playerid': playerId };
            return fetchData(url, 'GET', headers, null);
        }

        // Requests the next card in the player's deck by playerId
        async function nextCard(playerId) {
            const url = `${baseUrl}/next-card`;
            const headers = { 'Content-Type': 'application/json', 'playerid': playerId };
            return fetchData(url, 'GET', headers, null);
        }

        // Initiates a battle using a specific field (e.g., 'strength') for a player
        async function battle(playerId, field) {
            const url = `${baseUrl}/battle`;
            const headers = { 'Content-Type': 'application/json', 'playerid': playerId };
            const requestBody = { field };
            return fetchData(url, 'POST', headers, requestBody);
        }

        // Retrieves a list of all cards for the given playerId
        async function listCards(playerId) {
            const url = `${baseUrl}/cards`;
            const headers = { 'Content-Type': 'application/json', 'playerid': playerId };
            return fetchData(url, 'GET', headers, null);
        }

        // Buys a new card for the player, adding it to their deck
        async function buyCard(playerId) {
            const url = `${baseUrl}/buy-card`;
            const headers = { 'Content-Type': 'application/json', 'playerid': playerId };
            return fetchData(url, 'GET', headers, null);
        }

        // Helper function to perform fetch requests with error handling
        async function fetchData(url, method, headers, bodyJson) {
            const body = bodyJson ? JSON.stringify(bodyJson) : null;
            try {
                const response = await fetch(url, { method, headers, body });
                const data = await response.json();

                // If response is not OK, throw an error with status and message
                if (!response.ok) {
                    throw { status: response.status, message: JSON.stringify(data) };
                }

                // Return status and data on success
                return { status: response.status, data };
            } catch (error) {
                // Return error details in case of failure
                return { status: error.status || '-', error: error.message || 'Unknown error' };
            }
        }
```


Normally this code would be in its own Javascript file and be imported into the project that you are putting together. However, since this tutorial is just going to be creating an HTML document to be run on your local machine, I will be including this in the document. I didn’t want to dissuade you from trying this out by making you set up a webserver with CORS (Cross-Origin Resource Sharing) configured, but if you are happy doing this, you can easily extrapolate from what I am going to show you here.

This client provides a function for each of the endpoints that the API provides. It allows you to simply call the function with the required parameters and have the data returned as JSON. Since we will be using Javascript in the webpage, this makes it very easy to acquire the data we will need. Using JSON with JavaScript is a bit like watching Ayrton Senna race at Monaco—at first, it looks complex, but when you see it in action, you’re left wondering how it could ever be so easy. Sorry, I'm an unapologetic F1 fan...so not sorry ;-)

To learn about the API you can download my documentation for it from here: https://github.com/rilhia/dataiku-test/tree/main/doc-website. 

### Creating the HTML
OK first, this is not going to be pretty. For this example, the “look and feel” aren’t really a top priority for me. Put it this way, if I were designing cars, I wouldn’t be dealing with the aesthetics. So what we have here is going to be a very basic and very simple UI. However, it should be simple enough for you to build upon if you so wish. The UI we will end up with will look like this…

![Game Screenshot](images/tutorial_screenshot1.png)

 
…as I said, not pretty. But you should get the drift of what we are going for and maybe how you can think of improving upon it.

The HTML for this can be seen below…

```html


<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Top Trumps Game</title>
    <style>

       //Style code here

    </style>
</head>

<body>
    <h1>Turn-Based Game</h1>

    <!-- Username Input Section -->
    <div id="registration-section">
        <input type="text" id="username" placeholder="Enter your username" />
        <button onclick="handleRegistration()">Register / Login</button>
    </div>

    <!-- Start Game Button (Hidden initially) -->
    <button id="start-game-button" onclick="startGame()" style="display: none;">Start Game</button>

    <div id="player-record">
        <p id="username-display">Username: <span id="player-record-username"></span></p>
        <p>Wins: <span id="wins-display">0</span></p>
        <p>Losses: <span id="losses-display">0</span></p>
    </div>

    <div id="game-container">
        <div class="top-section">
            <div class="section" id="player-section">
                <h3>Player</h3>
                <div id="player-card">Loading your card...</div>
                <div class="buttons">
                    <button onclick="makeMove('strength')" class="move-button">Play Strength</button>
                    <button onclick="makeMove('skill')" class="move-button">Play Skill</button>
                    <button onclick="makeMove('size')" class="move-button">Play Size</button>
                    <button onclick="makeMove('popularity')" class="move-button">Play Popularity</button>
                    <button id="next-card-button" onclick="nextTurn()" style="display:none;">Next Card</button>
                </div>
            </div>
            <div class="section" id="computer-section">
                <h3>Computer</h3>
                <div id="computer-card">Waiting for player move...</div>
            </div>
        </div>
        <div class="score-section">
            <p>Player Score: <span id="player-score">7</span></p>
            <p>Computer Score: <span id="computer-score">7</span></p>
        </div>
    </div>


    <script>
      //Javascript goes here

    </script>
</body>

</html>
```

You may have noticed that I am calling Javascript functions directly from the HTML. Yes, this is somewhat antiquated. However, it saves on a fair amount of listener code and it works for this use case.

In the code above you will see the “//Style code here” comment at the top. The following CSS code goes here. Why didn’t I include it in the code above? Well, I don't usually keep my CSS in the same file as my HTML. Normally I would create a "style.css" file and import it. But, like the Javascript functions being called directly by the HTML, I figured this would save a bit of time here. I also thought it would be easier for you to decide how you want to do this if I have it separated in this tutorial.  You can see the CSS below…
```CSS

         #game-container {
            display: flex;
            flex-direction: column;
            width: 80%;
            margin: auto;
            margin-top: 50px;
            position: relative;
            min-height: 400px;
            justify-content: space-between;
        }

        .top-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
        }

        .section {
            width: 40%;
            margin: 10px;
        }

        #player-card,
        #computer-card {
            border: 1px solid #ccc;
            padding: 10px;
        }

        .buttons {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }

        .score-section {
            display: flex;
            justify-content: space-around;
            width: 100%;
            position: absolute;
            bottom: 0;
            padding-top: 20px;
        }

        .highlight-win {
            color: green;
            font-weight: bold;
        }

        .highlight-lose {
            color: red;
            font-weight: bold;
        }

        .highlight-draw {
            color: blue;
            font-weight: bold;
        }
```

As you can see, it is very limited and very basic. Simply copy this and paste it between the <style> tags or create your own CSS file and import it.

There is another comment in HTML code, this one between the <script> tags. This is where the Javascript goes. The “client” code, that I mentioned above, will go here. But there is also a fair amount more. I will go through this a feature at a time in the order that it should be added. There may be a degree of cross-referencing that is required here.

### 1. Game Variables:

- **playerScore & computerScore**: These variables essentially count the cards possessed by the player and computer. The game is set up to start with both having 7. During the game, a win for one will add 1 to the score and subtract 1 from the other’s score. 
- **playerData**: This is a JSON object that holds the player’s information retrieved from either the local storage or through registration (to be added to the local storage). It contains the player’s ID, the player’s username and game the win/loss records.
- **turn**: This variable holds whose turn it is, either "player" or "computer". It alternates after each move to manage game flow. The “player” always starts at game.

This goes at the top of the script section.

```javascript
        // Game variables
        let playerScore = 7;
        let computerScore = 7;
        let playerData;
        let turn = "player";
```


### 2. handleRegistration():

- This function handles the login or registration process. It first checks if the player is already registered by searching the local storage (**getPlayer(username)**) for the username entered in the input field.
- If the player exists, it retrieves their data and displays the “Start Game” button.
- If the player doesn’t exist, the function registers the user with an API call (**register(username, birthdate, email)**), generating a playerId. The data is then stored using **savePlayer(data.playerId, username)**.
- Finally, it disables the move buttons (enableButtons(false)) to prevent interactions before starting the game.
  
```javascript

        // Function for handling registration and login
        function handleRegistration() {
            (async () => {
                const username = document.getElementById('username').value;
                if (!username) {
                    alert("Please enter a username");
                    return;
                }

                // Retrieve player from local storage
                playerData = getPlayer(username);

                if (playerData) {
                    document.getElementById('start-game-button').style.display = 'block';
                } else {
                    // Hard code birthday and email for simplicity
                    const birthdate = '2000-01-01';
                    const email = `${username.toLowerCase()}@example.com`;

                    // Register a new player if not found in local storage
                    const { data } = await register(username, birthdate, email);
                    playerData = savePlayer(data.playerID, username);
                    document.getElementById('start-game-button').style.display = 'block';
                }

                // Display the player record
                displayPlayerRecord(playerData);
            })();

            //Disable buttons
            enableButtons(false);
        }
```

### 3. getPlayer(username):

- This function searches the local storage for the player’s data based on their username.
- It retrieves the list of players stored in the browser’s local storage, searches for the specified player, and returns their data if found. Otherwise, it returns null.
- This function is essential for retrieving data when users return to the game or reload the page.

```javascript
        // Retrieve a player from local storage by username
        function getPlayer(username) {
            const players = JSON.parse(localStorage.getItem('players')) || [];
            return players.find(player => player.username === username) || null;
        }
```


### 4. savePlayer(playerId, username, wins = 0, losses = 0):

- This function stores or updates the player’s information in local storage.
- If the player already exists, their playerId, wins and losses are updated. If they don’t exist, a new record is created.
- After updating or creating the player, it saves the updated player data back to the browser’s storage.

```javascript
        // Save or update player data in local storage
        function savePlayer(playerId, username, wins = 0, losses = 0) {
            const players = JSON.parse(localStorage.getItem('players')) || [];
            const playerIndex = players.findIndex(player => player.username === username);

            if (playerIndex !== -1) {
                // Update existing player
                players[playerIndex].playerId = playerId;
                players[playerIndex].wins = wins;
                players[playerIndex].losses = losses;
            } else {
                // Add new player
                players.push({ playerId, username, wins, losses });
            }

            localStorage.setItem('players', JSON.stringify(players));
            return players.find(player => player.username === username);
        }
```


### 5. updatePlayerRecord(username, win):

- This function updates the player’s win/loss record after each game.
- The **win** param is a boolean.
- If the player wins the round, their win count is incremented. If they lose, their loss count is increased.
- The function then updates the player’s record in local storage and returns the updated player object.

```javascript
        // Update player record with wins/losses
        function updatePlayerRecord(username, win) {
            const players = JSON.parse(localStorage.getItem('players')) || [];
            const playerIndex = players.findIndex(player => player.username === username);

            if (playerIndex !== -1) {
                if (win) {
                    players[playerIndex].wins += 1;
                } else {
                    players[playerIndex].losses += 1;
                }
                localStorage.setItem('players', JSON.stringify(players));
            }
            return players[playerIndex];
        }
```


### 6. displayPlayerRecord(data):

- This function displays the player’s statistics (username, wins, losses) in the UI by modifying the HTML elements with the retrieved data.
- It’s triggered after registration or login, and after the game ends (when the win/loss count is updated).

```javascript
        // Display player record data
        function displayPlayerRecord(data) {
            if (data) {
                document.getElementById('player-record-username').innerText = data.username;
                document.getElementById('wins-display').innerText = data.wins;
                document.getElementById('losses-display').innerText = data.losses;
            }
        }
```

### 7. startGame():

- This function resets the game for both the player and the computer. It sets their scores back to 7.
- It also calls the **listCards(playerData.playerId)** function to assess how many cards the player holds. This function takes the **playerId** kept in the **playerData** JSON object and uses it to call the **/cards** endpoint. This returns a JSON array of all of the cards held by the player.
- Should the player hold fewer than 7 cards, the **buyCard(playerData.playerId)** function is called to acquire new cards. One card at a time until 7 is reached.
- The player’s score and the computer’s score are then updated in the UI.
- It also sets the **turn** variable to "player" and calls the **displayPlayerCard()** function to show the first card.
- Finally, the buttons are enabled to allow the player to make a move using the **enableButtons(true)** function.

```javascript
        // Start a new game
        async function startGame() {
            playerScore = 7;
            computerScore = 7;

            let cards = await listCards(playerData.playerId);


            //Update the number of cards to 7 if below 7
            for (let j = cards.length; j <= 7; j++) {
                await buyCard(playerData.playerId);
            }

            document.getElementById('player-score').innerText = playerScore;
            document.getElementById('computer-score').innerText = computerScore;
            turn = "player";
            displayPlayerCard(); // Show the first card
            enableButtons(true); //Enable buttons
        }
```

### 8. displayPlayerCard():

- This function retrieves and displays the player’s next card from the API using the **nextCard(playerData.playerId)** function. This calls the **/next-card** endpoint.
- If the player’s score is valid (between 0 and 14) and a card is returned, it updates the player’s card details in the UI.
- If it’s the player’s turn, the computer card waits for the player’s move, otherwise, it triggers the computer’s move by calling the **computerMove()** function. The **enableButtons(true)** function is called if it is the player's move. If it is the computer's move the **enableButtons(false)** is called to disable the buttons.
- Note that there are a couple of "if" conditions in this with no "else" functionality, just console logging. These were placed there while I was building this in order to report on a few issues I was experiencing. Why are they still there? An oversight to be honest. But since I am writing this up now and they cause no issues, I have decided to be a "lazy developer" and get this out :-). 
    
```javascript

        // Display the player's next card
        async function displayPlayerCard() {
            const { data: cardData } = await nextCard(playerData.playerId);
            if (playerScore > 0 && playerScore < 14) {
                if (cardData) {
                    document.getElementById('player-card').innerHTML = `
                    <p>Name: ${cardData.name}</p>
                    <p>Strength: ${cardData.strength}</p>
                    <p>Skill: ${cardData.skill}</p>
                    <p>Size: ${cardData.size}</p>
                    <p>Popularity: ${cardData.popularity}</p>
                `;
                    if (turn === "player") {
                        document.getElementById('computer-card').innerHTML = 'Waiting for player move...';
                        enableButtons(true);
                    } else {
                        enableButtons(false);
                        computerMove();
                    }
                }else{
                    console.log("No card data");
		}
            }else{
                console.log("Check score data");
            }
        }
```


### 9. nextTurn():

- This function simply hides the “Next Card” button and triggers the **displayPlayerCard()** function to get the next card.
  
```javascript
        // Proceed to the next turn
        function nextTurn() {
            document.getElementById('next-card-button').style.display = 'none';
            displayPlayerCard();
        }
```

### 10. makeMove(field):

- This function allows the player to make a move by selecting a specific card field (e.g., strength, skill).
- It makes an API call to **/battle** by calling the **battle(playerData.playerId, field)** function to determine the outcome of the battle.
- Based on the result, it highlights the player’s card's attribute (**field**) and the opponent’s card's attribute with different colors depending on whether they won, lost, or drew.
- The scores are then updated by calling the **updateScores()** function and the turn alternates between player and computer.
  
```javascript

        // Make a player move and update scores based on the outcome
        async function makeMove(field) {
            enableButtons(false);
            const { data: battleResult } = await battle(playerData.playerId, field);

            if (battleResult) {
                const playerFieldClass = battleResult.outcome === 'win' ? 'highlight-win' : battleResult.outcome === 'loss' ? 'highlight-lose' : 'highlight-draw';
                const computerFieldClass = battleResult.outcome === 'loss' ? 'highlight-win' : battleResult.outcome === 'win' ? 'highlight-lose' : 'highlight-draw';

                document.getElementById('player-card').innerHTML = `
                <p>Name: ${battleResult.card.name}</p>
                <p>Strength: <span class="${field === 'strength' ? playerFieldClass : ''}">${battleResult.card.strength}</span></p>
                <p>Skill: <span class="${field === 'skill' ? playerFieldClass : ''}">${battleResult.card.skill}</span></p>
                <p>Size: <span class="${field === 'size' ? playerFieldClass : ''}">${battleResult.card.size}</span></p>
                <p>Popularity: <span class="${field === 'popularity' ? playerFieldClass : ''}">${battleResult.card.popularity}</span></p>
            `;

                document.getElementById('computer-card').style.display = 'block';
                document.getElementById('computer-card').innerHTML = `
                <p>Name: ${battleResult.opponentCard.name}</p>
                <p>Strength: <span class="${field === 'strength' ? computerFieldClass : ''}">${battleResult.opponentCard.strength}</span></p>
                <p>Skill: <span class="${field === 'skill' ? computerFieldClass : ''}">${battleResult.opponentCard.skill}</span></p>
                <p>Size: <span class="${field === 'size' ? computerFieldClass : ''}">${battleResult.opponentCard.size}</span></p>
                <p>Popularity: <span class="${field === 'popularity' ? computerFieldClass : ''}">${battleResult.opponentCard.popularity}</span></p>
            `;

                updateScores(battleResult.outcome);
            }

            turn = turn === "player" ? "computer" : "player";
        }
```

### 11. computerMove():

- This function simulates the computer’s move. After a countdown, it selects the field it wants to use. 
- Now, this is where logic to get around the API not showing the computer's card comes into play. It is not ideal and was somewhat of a quick to stop this from being entirely random. However I have actually given the computer an advantage here. The computer will see the player's card's attributes and use these, along with the attribute boundaries that are used by the API. Since I had no way of accessing the computer's card, I needed a way to effectively allow the computer to play "blind". I have since thought of adding another element which will get the computer to assess the order of best to worst possible attribute, then simply alternate between the top 2. However, I have left this very basic version in and maybe you can experiment and send me some ideas?
- Once the **field** is selected, the **makeMove(weakestField.field)** function is called. Essentially making the player's move for them...hence the logic explained above.

```javascript

        // Execute the computer's move
        async function computerMove() {
            let countdown = 3;
            const timer = setInterval(() => {
                document.getElementById('computer-card').innerHTML = `Computer moving in ${countdown}...`;
                countdown--;
                if (countdown < 0) clearInterval(timer);
            }, 1000);

            await new Promise(resolve => setTimeout(resolve, 5000));

            const { data: cardData } = await nextCard(playerData.playerId);
            if (cardData) {
                const fields = [
                    { field: 'strength', value: cardData.strength, min: 0, max: 49 },
                    { field: 'skill', value: cardData.skill, min: 0, max: 29 },
                    { field: 'size', value: cardData.size, min: 5, max: 11 },
                    { field: 'popularity', value: cardData.popularity, min: 0, max: 10 }
                ];

                fields.forEach(field => {
                    field.weaknessScore = (field.value - field.min) / (field.max - field.min);
                });

                const weakestField = fields.reduce((weakest, current) =>
                    current.weaknessScore < weakest.weaknessScore ? current : weakest
                );

                makeMove(weakestField.field);
            }
        }
```

### 12. updateScores(outcome):

- This function adjusts the player and computer scores based on the outcome of the round (win or loss).
- If a player’s score reaches zero, it triggers the **endGame()** function to end the game. It also updates the player's overall record by calling the **updatePlayerRecord(playerData.username, playerScore != 0)** function with a true/false calculated using **playerScore != 0** Otherwise, the “Next Card” button is displayed, allowing the next round to begin.

```javascript


        // Update player and computer scores
        function updateScores(outcome) {
            if (outcome === 'win') {
                playerScore++;
                computerScore--;
            } else if (outcome === 'loss') {
                playerScore--;
                computerScore++;
            }
            document.getElementById('player-score').innerText = playerScore;
            document.getElementById('computer-score').innerText = computerScore;

            if (playerScore <= 0 || computerScore <= 0) {
                endGame(playerScore <= 0 ? "Computer" : "Player");
                playerData = updatePlayerRecord(playerData.username, playerScore != 0);
                displayPlayerRecord(playerData);
            } else {
                document.getElementById('next-card-button').style.display = 'block';
            }
        }
```


### 13. enableButtons(enable):

- This function enables or disables the move buttons (strength, skill, size, popularity) based on the enable boolean parameter.
- It is used to prevent the player from making a move while the computer is playing or when the game hasn’t started yet.
  
```javascript

        // Enable or disable move buttons based on the provided boolean value
        function enableButtons(enable) {
            const buttons = document.querySelectorAll('.move-button');
            buttons.forEach(button => {
                button.disabled = !enable;
            });
        }
```

### 14. endGame(winner):

- This function displays an alert announcing the winner of the game. Pretty basic, yes. But it does the job. Feel free to change if you choose to enhance this.
- It also disables the buttons to prevent further moves using the **enableButtons(false)** function.
  
```javascript

        // Function to alert the winner
        function endGame(winner) {
            alert(`${winner} wins!`);
            enableButtons(false);
        }
```


### 15. Startup Function(s)
- The startup function **enableButtons(false)** ensures that the user’s game play buttons are initially disabled when the game is loaded. This is a safeguard to prevent the player from interacting with the game controls before the proper setup is complete and a playerId is created/identified.
  
```javascript

        // Start with buttons disabled
        enableButtons(false);
```

### Reflections and Next Steps

While the game is now playable, there are still many ways it could be enhanced. For example:

- **Computer Logic**: The computer uses a simplistic method to choose fields, relying on player data and field weaknesses. A better process could be developed to make better or more realistic decisions.
- **UI Design**: The interface is bare-bones and could benefit from more a lot of polish. Enhancing the visual design, adding animations, or improving the card layout would make it more engaging.
- **Win Conditions**: The game ends when one player reaches 14 cards, but this isn’t necessarily the most compelling way to declare a winner. You could add win conditions based on rounds, points, or even by introducing different game modes for variety.
- **Player Session Handling**: While player data is stored using localStorage, this is not ideal for longer-term game tracking. Adding server-side storage or integrating with a database could allow for a more persistent game, especially if multiple players want to access the game from different devices.
- **Lazy Developer Syndrome**: Some parts of the code (like console logging when certain conditions aren’t met) were left in for quick debugging. Ideally, this should be replaced with error handling and user-friendly messaging.

These are just a few ideas for improving the project. I’d love to hear how others might build upon or tweak this game, so feel free to take a copy, share your modifications and/or suggest new features!

### Conclusion

And that’s a wrap! We’ve turned a quirky Game API into a working game, imperfections and all. Unlike Red Bull Racing, I don’t have a “sister team” to lean on for extra help (…and for the record, I’m not a Red Bull fan! 😉). But that’s part of the fun, and I’d love to hear your thoughts on tweaks or improvements. You can find the game in it's completed state here: https://github.com/rilhia/dataiku-test/tree/main/tutorial/game










































