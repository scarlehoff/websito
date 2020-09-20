// Select DOM elements to work with
const mainContainer = document.getElementById('main-container');
const signinButtonElm = document.getElementById('signmein');
const showTasksButtonElm = document.getElementById('showTasks');
const selectorWebElm = document.getElementById('selectorWeb');

const Views = { error: 1, home: 2, calendar: 3 };
var account = null;

// --- Initialize the Graph client
// TODO At this point we should read up config.js
// for devleopment we will put some placeholder config.js file here, which needs to be reset
// after deployment
//
const msalConfig = {
  auth: {
    clientId: 'ee9c4b26-6a40-4418-a476-0378c7ad7ef5', // temporary id for testing
    redirectUri: 'http://localhost:3000/todoapp'
  }
};
// 1. Create the main MSAL instance
const msalClient = new msal.PublicClientApplication(msalConfig);

// 2. Select the permissions we need to use
const msalRequest = {
  scopes: [
    'email',
    'openid',
    'offline_access',
    'profile',
    'user.read',
    'Tasks.Read',
    'Tasks.Read.Shared',
    'Tasks.ReadWrite',
    'Tasks.ReadWrite.Shared'
  ]
}

// 3. Prepare the getToken function (why is this not included in the API is beyond me)
async function getToken() {
  let account = sessionStorage.getItem('msalAccount');
  if (!account) throw new Error('User account missing from session. Please sign out and sign in again.');

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

// 4. Create an authentication provider (basically an object with the getToken function)
const authProvider = {
  getAccessToken: async () => {
    return await getToken();
  }
};

// 5. Instantiate the graph client to be used by the API calls
const graphClient = MicrosoftGraph.Client.initWithMiddleware({authProvider});
//-------------------- Graph client initialized

/* API call to Microsoft Graph to receive a list of all lists
 * in my MS To do account */
let listOfLists = null;
async function getAllLists() {
  let ret = null;
  try {
    const response = await graphClient.api('/me/todo/lists').version('beta').get();
    ret = response.value;
  } catch (error) {
    console.log("Error getting list of tasks");
    console.log(error);
    updatePage(Views.error, {message: 'Error', debug:error});
  }
  return ret;
}

/* Update the selector of lists of tasks
 * This function must be called upon first log in to fill in the selector
 */
async function updateList() {
  if (!listOfLists) {
    selectorWebElm.innerHTML = '<option>Fetching results...</option>';
    console.log("Fetching lists");
    let results = await getAllLists();
    if (results) {
      listOfLists = results;
    } else {
      throw new Error("Did not receive any lists?");
    }
  }
  console.log("Filling in options");
  let options = '<option selected>Select a list</option>';
  for (res of listOfLists) {
    options += `<option value="${res.id}">${res.displayName}</option>`;
  }
  selectorWebElm.innerHTML = options;
}







function createElement(type, className, text) {
  var element = document.createElement(type);
  element.className = className;

  if (text) {
    var textNode = document.createTextNode(text);
    element.appendChild(textNode);
  }

  return element;
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

function showCalendar(events) {
  // TEMPORARY
  // Render the results as JSON
  var alert = createElement('div', 'alert alert-success');

  var pre = createElement('pre', 'alert-pre border bg-light p-2');
  alert.appendChild(pre);

  var code = createElement('code', 'text-break',
    JSON.stringify(events, null, 2));
  pre.appendChild(code);

  mainContainer.innerHTML = '';
  mainContainer.appendChild(alert);
}

function updatePage(view, data) {
  if (!view) {
    view = Views.home;
  }

  const user = JSON.parse(sessionStorage.getItem('graphUser'));

  if (user) {
    // Hide the signin button
    signinButtonElm.style.display = "none";
    showTasksButtonElm.style.display = null;
    // Receive all lists and fill in the selector
    updateList();
  } else {
    // Show it up again
    signinButtonElm.style.display = null;
    showTasksButtonElm.style.display = "none";
  }

  switch (view) {
    case Views.error:
      showError(data);
      break;
    case Views.home:
      break;
    case Views.calendar:
      showCalendar(data);
      break;
  }
}



updatePage(Views.home);

// ---  auth.js

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

async function getUser() {
  return await graphClient
    .api('/me')
    // Only get the fields used by the app
    .select('id,displayName,mail,userPrincipalName,mailboxSettings')
    .get();
}

async function getEvents() {
  const user = JSON.parse(sessionStorage.getItem('graphUser'));

  // Convert user's Windows time zone ("Pacific Standard Time")
  // to IANA format ("America/Los_Angeles")
  // Moment needs IANA format
  let ianaTimeZone = "Etc/GMT";
  console.log(`Converted: ${ianaTimeZone}`);

  // Configure a calendar view for the current week
  // Get midnight on the start of the current week in the user's timezone,
  // but in UTC. For example, for Pacific Standard Time, the time value would be
  // 07:00:00Z
  let startOfWeek = moment.tz('America/Los_Angeles').startOf('week').utc();
  // Set end of the view to 7 days after start of week
  let endOfWeek = moment(startOfWeek).add(7, 'day');
  console.log("This point");

  try {
    // GET /me/calendarview?startDateTime=''&endDateTime=''
    // &$select=subject,organizer,start,end
    // &$orderby=start/dateTime
    // &$top=50
    console.log("Started response");
    let response = await graphClient
      .api('/me/todo/lists').version('beta')
//      .api('/me/calendarview') // This needs to change to /me/todo/lists to get the lists or /me/todo/lists/{listname}/tasks to get the tasks in a list
      // Set the Prefer=outlook.timezone header so date/times are in
      // user's preferred time zone
//      .header("Prefer", `outlook.timezone="${user.mailboxSettings.timeZone}"`)
//      // Add the startDateTime and endDateTime query parameters
//      .query({ startDateTime: startOfWeek.format(), endDateTime: endOfWeek.format() })
//      // Select just the fields we are interested in
//      .select('subject,organizer,start,end')
//      // Sort the results by start, earliest first
//      .orderby('start/dateTime')
//      // Maximum 50 events in response
//      .top(50)
      .get();
    updatePage(Views.calendar, response.value);
  } catch (error) {
    updatePage(Views.error, {
      message: 'Error getting events',
      debug: error
    });
  }
}
