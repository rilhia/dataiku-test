// -----------------------------------
// Base URL feature + Listener
// -----------------------------------

// Set the default base URL for API calls
let baseUrl = 'http://localhost:4000';

// Get the input element for the base URL
const baseUrlInput = document.getElementById("baseUrlInput");

// Function to update all base URLs in the curl examples
function updateBaseURLs() {
  const curlBaseURLs = document.querySelectorAll('.curlBaseURL');
  curlBaseURLs.forEach(span => {
    span.textContent = baseUrl;
  });
}

// Update the base URL variable when input changes
baseUrlInput.addEventListener("input", function(event) {
  baseUrl = event.target.value;
  updateBaseURLs();
});


// -----------------------------------
// Try It Now Listeners
// -----------------------------------

// Initialize form event listeners on DOM load
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("pingForm").addEventListener("submit", handleFormSubmit(ping));
  document.getElementById("registerForm").addEventListener("submit", handleFormSubmit(register));
  document.getElementById("profileForm").addEventListener("submit", handleFormSubmit(getProfile));
  document.getElementById("buyCardForm").addEventListener("submit", handleFormSubmit(buyCard));
  document.getElementById("nextCardForm").addEventListener("submit", handleFormSubmit(nextCard));
  document.getElementById("battleForm").addEventListener("submit", handleFormSubmit(battle));
  document.getElementById("listCardsForm").addEventListener("submit", handleFormSubmit(listCards));
});

// Generic function to handle form submit events
function handleFormSubmit(callback) {
  return function(event) {
    event.preventDefault();
    callback();
  };
}

// -----------------------------------
// API Endpoint Functions
// -----------------------------------

// Ping the server to check its status
function ping() {
  const url = `${baseUrl}/ping`;
  const headers = { 'Content-Type': 'application/json' };
  
  fetchData(url, 'GET', headers, null, 'pingResponse');
}

// Register a new player
function register() {
  const url = `${baseUrl}/register`;
  const headers = { 'Content-Type': 'application/json' };
  const requestBody = {
    username: document.getElementById('registerUsername').value,
    birthdate: document.getElementById('registerBirthdate').value,
    email: document.getElementById('registerEmail').value
  };

  fetchData(url, 'POST', headers, requestBody, 'registerResponse', updatePlayerIdFields);
}

// Retrieve player profile information
function getProfile() {
  const url = `${baseUrl}/profile`;
  const headers = {
    'Content-Type': 'application/json',
    'playerid': document.getElementById('profilePlayerId').value
  };

  fetchData(url, 'GET', headers, null, 'profileResponse');
}

// Buy a new card for the player's deck
function buyCard() {
  const url = `${baseUrl}/buy-card`;
  const headers = {
    'Content-Type': 'application/json',
    'playerid': document.getElementById('buyCardPlayerId').value
  };

  fetchData(url, 'GET', headers, null, 'buyCardResponse');
}

// Retrieve the player's next card
function nextCard() {
  const url = `${baseUrl}/next-card`;
  const headers = {
    'Content-Type': 'application/json',
    'playerid': document.getElementById('nextCardPlayerId').value
  };

  fetchData(url, 'GET', headers, null, 'nextCardResponse');
}

// Start a battle with the computer using a chosen attribute
function battle() {
  const url = `${baseUrl}/battle`;
  const headers = {
    'Content-Type': 'application/json',
    'playerid': document.getElementById('battlePlayerId').value
  };
  const requestBody = {
    field: document.getElementById('battleField').value
  };

  fetchData(url, 'POST', headers, requestBody, 'battleResponse');
}

// List all cards in the player's deck
function listCards() {
  const url = `${baseUrl}/cards`;
  const headers = {
    'Content-Type': 'application/json',
    'playerid': document.getElementById('cardsPlayerId').value
  };

  fetchData(url, 'GET', headers, null, 'listCardsResponse');
}

// -----------------------------------
// Helper Functions
// -----------------------------------

// Fetch data from the server and handle the response
function fetchData(url, method, headers, bodyJson, containerId, callback) {
  const body = bodyJson ? JSON.stringify(bodyJson) : null;
  fetch(url, { method, headers, body})
    .then(response => {
      return response.json().then(data => {
        if (!response.ok) {
          const errorMessage = JSON.stringify(data);
          const appError = data.errorCode;
          throw { status: response.status, message: errorMessage, appError: appError};
        }
        return { status: response.status, data };
      });
    })
    .then(({ status, data }) => {
      const responseBody = JSON.stringify(data, null, 2);
      const requestBody = bodyJson ? JSON.stringify(bodyJson, null, 2) : null;
      generateApiResponseHtml(containerId, method, status, url, JSON.stringify(headers, null, 2), requestBody, responseBody, '', '');
      if (callback) callback(data);
    })
    .catch(error => {
      const requestBody = bodyJson ? JSON.stringify(bodyJson, null, 2) : null;
      generateApiResponseHtml(containerId, method, error.status || '-', url, JSON.stringify(headers, null, 2), requestBody, '', error.appError, error.message);
    });
}

// Update playerID fields after successful registration. Enables "Try It Now" playerID to be automated
function updatePlayerIdFields(data) {
  const playerId = data.playerID;
  ['profilePlayerId', 'buyCardPlayerId', 'nextCardPlayerId', 'battlePlayerId', 'cardsPlayerId'].forEach(id => {
    document.getElementById(id).value = playerId;
  });
}

// Generate HTML to display API response details
function generateApiResponseHtml(containerId, httpType, httpStatus, urlCalled, requestHeader, requestBody, responseBody, appError, errorMessage) {
  const container = document.getElementById(containerId);

  // Define HTTP Status display, defaulting to "-" if null
  const statusDisplay = httpStatus !== null ? httpStatus : '-';

  // Generate the Header Section
  let htmlContent = `
    <div class="header">
      <div class="type-status">
        <div><span class="label">HTTP Type:</span> <span id="httpType">${httpType}</span></div>
        <div><span class="label">HTTP Status:</span> <span id="httpStatus">${statusDisplay}</span></div>
        <div><span class="label">URL Called:</span> <span id="urlCalled">${urlCalled}</span></div>
      </div>
    </div>
  `;


htmlContent += `
    <div class="section">
      <div class="left">
        <div class="label">Request Header:
        <span class="copy-icon" onclick="copyToClipboard('${containerId}RequestHeader')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="copy-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg></span>
        <span class="copyMessage" id="${containerId}RequestHeaderCopyMessage">Copied!</span>
        </div>
        
        <div class="box" id="${containerId}RequestHeader"><pre>${requestHeader || 'N/A'}</pre></div>
      </div>
      <div class="right">
        <div class="label">Request Body:
        <span class="copy-icon" onclick="copyToClipboard('${containerId}RequestBody')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="copy-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg></span>
        <span class="copyMessage" id="${containerId}RequestBodyCopyMessage">Copied!</span>
        </div>
        
        <div class="box" id="${containerId}RequestBody"><pre>${requestBody || 'N/A'}</pre></div>
      </div>
    </div>
  `;

  // Generate the Response or Error Section
  if (httpStatus === 200) {
    // If httpStatus is 200, show the response body
    htmlContent += `
      <div class="response-body">
        <div class="label">Response Body:
        <span class="copy-icon" onclick="copyToClipboard('${containerId}ResponseBody')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="copy-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg></span>
        <span class="copyMessage" id="${containerId}ResponseBodyCopyMessage">Copied!</span>
        </div>
        
        <div class="box" id="${containerId}ResponseBody"><pre>${responseBody}</pre></div>
      </div>
    `;
  } else if (httpStatus === 400) {
    // If httpStatus is 400, show the app status and error message
    htmlContent += `
      <div class="response-body">
        <div class="label">App Error Code:</div>
        <div class="box" id="appStatus">${appError}</div>
        <div class="label">Error Message:
        <span class="copy-icon" onclick="copyToClipboard('${containerId}ErrorMessage')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="copy-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg></span>
        <span class="copyMessage" id="${containerId}ErrorMessageCopyMessage">Copied!</span>
        </div>
        
        <div class="box" id="${containerId}ErrorMessage">${errorMessage}</div>
      </div>
    `;
  } else {
    // If httpStatus is null or anything else, show the error message with HTTP Status as "-"
    htmlContent += `
      <div class="response-body">
        <div class="label">Error Message:
        <span class="copy-icon" onclick="copyToClipboard('${containerId}ErrorMessage')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="copy-svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg></span>
        <span class="copyMessage" id="${containerId}ErrorMessageCopyMessage">Copied!</span>
        </div>
        
        <div class="box" id="${containerId}ErrorMessage">${errorMessage}</div>
      </div>
    `;
  }

  // Append the generated HTML to the container
  container.innerHTML = htmlContent;
}



// Copy text content to clipboard
function copyToClipboard(id) {
  const textToCopy = document.getElementById(id).textContent;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const copyMessage = document.getElementById(`${id}CopyMessage`);
    if (copyMessage) {
      copyMessage.style.display = 'inline';
      setTimeout(() => { copyMessage.style.display = 'none'; }, 2000);
    }
  }).catch(err => console.error("Could not copy text: ", err));
}

// -------------------------------------------------------------
// Webpage Navigation Controls - Deals with sidebar functionality
// -------------------------------------------------------------

window.addEventListener("load", function () {	
  const contentArea = document.getElementById("content");

  function toggleSection(event) {
    const listItem = event.currentTarget.parentElement;
    const nestedList = listItem.querySelector(".nested");
    const toggleIcon = listItem.querySelector(".toggle-icon");
    const mainSectionId = listItem.querySelector("a[data-main-section]").getAttribute("data-main-section");
    const mainSection = document.getElementById(mainSectionId);
    
  
    if (nestedList.style.display !== "block") {
      // Hide all other nested lists and sections
      document.querySelectorAll(".nested").forEach(list => list.style.display = "none");
      document.querySelectorAll(".api-section").forEach(section => section.style.display = "none");
      document.querySelectorAll(".toggle-icon").forEach(icon => icon.textContent = "+");
      document.querySelectorAll(".toggle-icon").forEach(icon => icon.textContent = "+");
      document.querySelectorAll("#sidebar ul li.active").forEach(item => item.classList.remove("active"));


      listItem.classList.add("active");

      // Show the selected nested list and main section
      nestedList.style.display = "block";
      if(toggleIcon){
        toggleIcon.textContent = "-";
      }
      mainSection.style.display = "block";
      mainSection.scrollIntoView({ behavior: "smooth", block: "start" });
      contentArea.style.display = "block";
    } else {

      // Check if the mainSection is already at the top of the view
      const sectionTop = mainSection.getBoundingClientRect().top;

      if (sectionTop === 0) {
        // Section is already at the start of the viewport
        if(toggleIcon){
          toggleIcon.textContent = "+";
        }
        mainSection.style.display = "none";
        nestedList.style.display = "none";

        listItem.classList.remove("active");
      } else {
        // Section is not at the top, scroll it into view
        mainSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

    }
  }



  // Add listener to each <li> element to capture clicks on both <span> and <a>
  document.querySelectorAll("#sidebar > ul > li > a").forEach(listItem => {
    listItem.addEventListener("click", toggleSection);
  });

  // Handle smooth scrolling for subsections
  document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("#sidebar a[href^='#']").forEach(link => {
    link.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent the default behavior of the anchor link
      const sectionId = link.getAttribute("href").substring(1); // Extract the target section ID
      const targetSection = document.getElementById(sectionId);

      // Scroll smoothly to the target section
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
});
});

