// --- ui.js
// Select DOM elements to work with
const authenticatedNav = document.getElementById('authenticated-nav');
const accountNav = document.getElementById('account-nav');
const mainContainer = document.getElementById('main-container');

const Views = { error: 1, home: 2, calendar: 3 };
var account = null;

function createElement(type, className, text) {
  var element = document.createElement(type);
  element.className = className;

  if (text) {
    var textNode = document.createTextNode(text);
    element.appendChild(textNode);
  }

  return element;
}

function showAuthenticatedNav(user, view) {
  authenticatedNav.innerHTML = '';

  if (user) {
    // Add Calendar link
    var calendarNav = createElement('li', 'nav-item');

    var calendarLink = createElement('button',
      `btn btn-link nav-link${view === Views.calendar ? ' active' : '' }`,
      'Calendar');
    calendarLink.setAttribute('onclick', 'getEvents();');
    calendarNav.appendChild(calendarLink);

    authenticatedNav.appendChild(calendarNav);
  }
}

function showAccountNav(user) {
  accountNav.innerHTML = '';

  if (user) {
    // Show the "signed-in" nav
    accountNav.className = 'nav-item dropdown';

    var dropdown = createElement('a', 'nav-link dropdown-toggle');
    dropdown.setAttribute('data-toggle', 'dropdown');
    dropdown.setAttribute('role', 'button');
    accountNav.appendChild(dropdown);

    var userIcon = createElement('i',
      'far fa-user-circle fa-lg rounded-circle align-self-center');
    userIcon.style.width = '32px';
    dropdown.appendChild(userIcon);

    var menu = createElement('div', 'dropdown-menu dropdown-menu-right');
    dropdown.appendChild(menu);

    var userName = createElement('h5', 'dropdown-item-text mb-0', user.displayName);
    menu.appendChild(userName);

    var userEmail = createElement('p', 'dropdown-item-text text-muted mb-0', user.mail || user.userPrincipalName);
    menu.appendChild(userEmail);

    var divider = createElement('div', 'dropdown-divider');
    menu.appendChild(divider);

    var signOutButton = createElement('button', 'dropdown-item', 'Sign out');
    signOutButton.setAttribute('onclick', 'signOut();');
    menu.appendChild(signOutButton);
  } else {
    // Show a "sign in" button
    accountNav.className = 'nav-item';

    var signInButton = createElement('button', 'btn btn-outline-success btn-link nav-link', 'Sign in');
    signInButton.setAttribute('onclick', 'signIn();');
    accountNav.appendChild(signInButton);
  }
}

function showWelcomeMessage(user) {
  // Create jumbotron
  var jumbotron = createElement('div', 'jumbotron');

  var heading = createElement('h1', null, 'JavaScript SPA Graph Tutorial');
  jumbotron.appendChild(heading);

  var lead = createElement('p', 'lead',
    'This sample app shows how to use the Microsoft Graph API to access' +
    ' a user\'s data from JavaScript.');
  jumbotron.appendChild(lead);

  if (account) {
    // Welcome the user by name
    var welcomeMessage = createElement('h4', null, `Welcome ${user.displayName}!`);
    jumbotron.appendChild(welcomeMessage);

    var callToAction = createElement('p', null,
      'Use the navigation bar at the top of the page to get started.');
    jumbotron.appendChild(callToAction);
  } else {
    // Show a sign in button in the jumbotron
    var signInButton = createElement('button', 'btn btn-primary btn-large',
      'Click here to sign in');
    signInButton.setAttribute('onclick', 'signIn();')
    jumbotron.appendChild(signInButton);
  }

  mainContainer.innerHTML = '';
  mainContainer.appendChild(jumbotron);
}

function showError(error) {
  var alert = createElement('div', 'alert alert-danger');

  var message = createElement('p', 'mb-3', error.message);
  alert.appendChild(message);

  if (error.debug)
  {
    var pre = createElement('pre', 'alert-pre border bg-light p-2');
    alert.appendChild(pre);

    var code = createElement('code', 'text-break text-wrap',
      JSON.stringify(error.debug, null, 2));
    pre.appendChild(code);
  }

  mainContainer.innerHTML = '';
  mainContainer.appendChild(alert);
}

function updatePage(view, data) {
  if (!view) {
    view = Views.home;
  }

  const user = JSON.parse(sessionStorage.getItem('graphUser'));

  showAccountNav(user);
  showAuthenticatedNav(user, view);

  switch (view) {
    case Views.error:
      showError(data);
      break;
    case Views.home:
      showWelcomeMessage(user);
      break;
    case Views.calendar:
      break;
  }
}

updatePage(Views.home);

// ---  auth.js

// config js
const msalConfig = {
  auth: {
    clientId: 'ee9c4b26-6a40-4418-a476-0378c7ad7ef5', // temporary id for testing
    redirectUri: 'http://localhost:3000/todoapp'
  }
};

const msalRequest = {
  scopes: [
    'user.read',
    'mailboxsettings.read',
    'calendars.readwrite'
  ]
}
// Create the main MSAL instance
const msalClient = new msal.PublicClientApplication(msalConfig);
async function getToken() {
  let account = sessionStorage.getItem('msalAccount');
  if (!account){
    throw new Error(
      'User account missing from session. Please sign out and sign in again.');
  }

  try {
    // First, attempt to get the token silently
    const silentRequest = {
      scopes: msalRequest.scopes,
      account: msalClient.getAccountByUsername(account)
    };

    const silentResult = await msalClient.acquireTokenSilent(silentRequest);
    return silentResult.accessToken;
  } catch (silentError) {
    // If silent requests fails with InteractionRequiredAuthError,
    // attempt to get the token interactively
    if (silentError instanceof msal.InteractionRequiredAuthError) {
      const interactiveResult = await msalClient.acquireTokenPopup(msalRequest);
      return interactiveResult.accessToken;
    } else {
      throw silentError;
    }
  }
}
async function signIn() {
  // Login
  try {
    // Use MSAL to login
    const authResult = await msalClient.loginPopup(msalRequest);
    console.log('id_token acquired at: ' + new Date().toString());
    // Save the account username, needed for token acquisition
    sessionStorage.setItem('msalAccount', authResult.account.username);

    // Get the user's profile from Graph
    user = await getUser();
    // Save the profile in session
    sessionStorage.setItem('graphUser', JSON.stringify(user));
    updatePage(Views.home);
  } catch (error) {
    console.log(error);
    updatePage(Views.error, {
      message: 'Error logging in',
      debug: error
    });
  }
}
function signOut() {
  account = null;
  sessionStorage.removeItem('graphUser');
  msalClient.logout();
}

// --- graph.js
// Create an authentication provider
const authProvider = {
  getAccessToken: async () => {
    // Call getToken in auth.js
    return await getToken();
  }
};

// Initialize the Graph client
const graphClient = MicrosoftGraph.Client.initWithMiddleware({authProvider});

async function getUser() {
  return await graphClient
    .api('/me')
    // Only get the fields used by the app
    .select('id,displayName,mail,userPrincipalName,mailboxSettings')
    .get();
}