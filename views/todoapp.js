moment.updateLocale('en', { week: { dow: 1, } });

// Select DOM elements to work with
const mainContainer = document.getElementById('main-container');
const signinButtonElm = document.getElementById('signmein');
const showTasksButtonElm = document.getElementById('showTasks');
const selectorWebElm = document.getElementById('selectorWeb');
const calendarElm = document.getElementById('datepicker');

const Views = { error: 1, home: 2, calendar: 3 };
var account = null;

// --- Initialize the Graph client
// Read config.js, which must contain something like this
// and need to be included before this file!
//const msalConfig = {
//  auth: {
//    clientId: <some client/app id>,
//    redirectUri: window.location.href
//  }
//};
// 1. Create the main MSAL instance
const msalClient = new msal.PublicClientApplication(msalConfig);

// 2. Select the permissions we need to use
const msalRequest = {
  scopes: [
    'user.read',
    'Tasks.ReadWrite',
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
      main.innerHTML = silentError;
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

// --- Sign In API
// Functions used for sign-in/out
async function signIn() {
  // Login
  try {
    // Use MSAL to login
    const authResult = await msalClient.loginPopup(msalRequest);
    console.log('id_token acquired at: ' + new Date().toString());
    // Save the account username, needed for token acquisition
    sessionStorage.setItem('msalAccount', authResult.account.username);
    console.log("Saving account", authResult.account);

    // Get the user's profile from Graph
    user = await getUser();
    console.log("Login success: ", user);
    // Save the profile in session
    sessionStorage.setItem('graphUser', JSON.stringify(user));
    updatePage();
  } catch (error) {
    console.log(error);
    mainCoptions.innerHTML = error;
  }
}
function signOut() {
  account = null;
  sessionStorage.removeItem('graphUser');
  msalClient.logout();
}
async function getUser() {
  return await graphClient
    .api('/me')
    .select('id')
    .get();
}
// --------------------------------------------------------------------


//------------ User-space functions
//--- Getting the list of lists
/* API call to Microsoft Graph to receive a list of all lists
 * in my MS To do account */
let listOfLists = null;
async function getAllLists() {
  let ret = null;
  try {
    const response = await graphClient.api('/me/todo/lists').version('beta').get();
    ret = response.value;
  } catch (error) {
    console.log(error);
    mainContainer.innerHTML = error.message;
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
      return;
    }
  }
  console.log("Filling in options");
  let options = '<option selected value="">Select a list</option>';
  for (res of listOfLists) {
    let displayName = res.displayName;
    if (displayName == "Tasks") displayName = "Untagged tasks";
    options += `<option value="${res.id}">${displayName}</option>`;
  }
  selectorWebElm.innerHTML = options;
}


//--- Getting all tasks once a list is selected
/* This function calls the Graph API
 * to receive a list of tasks for the selected list */
async function fetchTasks(selectedId, query) {
  // API call to receive the list of tasks
  try {
    let response = await graphClient
      .api(`me/todo/lists/${selectedId}/tasks`)
      .version('beta')
      .filter(query)
      .top(50)
      .get();
    console.log("Response: ", response);
    return response.value;
  } catch (error) {
    console.log("Error getting list of tasks");
    console.log(error);
    updatePage(Views.error, {message: 'Error', debug:error});
  }
  return;
}

/* Function called by the user to receive a list of tasks
 * This function checks that a list was selected
 * calls the API
 * calls the filter
 * fills in the html
 */
async function showTasks() {
  // Check that indeed a list was selected
  const selectedOption = selectorWebElm.selectedOptions[0];
  const selectedId = selectedOption.value;
  if (selectedId == "") {
    console.log("No value selected, do nothing");
    return;
  }
  const listTitle = selectedOption.text;

  // Get the dateframe
  const dateRange = calendarElm.value.split("-");
  const startDate = moment(dateRange[0], 'DD/MM/YYYY');
  const finalDate = moment(dateRange[1], 'DD/MM/YYYY');

  // Prepare the query
  let query = "status eq 'completed'"; // we want only completed tasks
  query += ` and completedDateTime/dateTime ge '${startDate.format('YYYY-MM-DD')}'`;
  query += ` and completedDateTime/dateTime le '${finalDate.format('YYYY-MM-DD')}'`;

  // Fetch the tasks
  console.log(`Fetching tasks for ${listTitle}`);
  const tasks = await fetchTasks(selectedId, query);
  if (!tasks) {
      throw new Error("Did not receive any tasks?");
  }

  // Now write them down
  let listOfTasks = "";
  for (task of tasks) {
    // Title of the task
    let title = task.title;
    // Link to task in To Do
    const linkToTask = `https://to-do.live.com/tasks/id/${task.id}/details`;

    // Check whether the task includes extra information
    const bodyContent = task.body.content;
    if (bodyContent) {
      // This body content can be just text or complete html!
      let btext = bodyContent;
      if (task.body.contentType == "html") {
        btext = (new DOMParser).parseFromString(bodyContent, 'text/html').documentElement.textContent;
      }
      // Now it seems that everyone has "body content" so this is less than ideal
      // but there is a <!-- comment that gets through the body content?
      // Maybe it is a bug in Microsoft's side, but let's play along for now...
      // write a msg to console though
      btext = btext.trim();
      if (btext.startsWith("<!--") && btext.endsWith("-->")) { // it is a comment
        console.log("Text covered by <!-- --!> so understood as a comment and ignored!");
      } else {
        // Add an icon that upon hovering adds extra information
        title += ` <i class="fas fa-window-restore" data-toogle="tooltip" title="${btext}"/>`;
      }
    }

    listOfTasks += `
      <tr>
        <td>
         <a href="${linkToTask}" target="_blank" class="fas fa-external-link-alt"></a> ${title}
        </td>
      </tr>`;
  }

  // Write down the HTML
  const tableContent = `<div class="table-responsive">
  <table class="table table-sm table-striped"">
    <thead style="text-align:center;">
      <tr> 
        <th><h4>Tasks from ${listTitle} completed between ${startDate.format('DD/MM/YYYY')} and ${finalDate.format('DD/MM/YYYY')} </h4></th>
      </tr>
    </thead>
    <tbody>${listOfTasks}</tbody>
  </table>
  </div>`

  mainContainer.innerHTML = tableContent;
}

/* Update page function
 * This function is called every time some important event happens
 * such as refresh or login
 * and hides/shows the right buttons/elements
 */
function updatePage() {
  const user = JSON.parse(sessionStorage.getItem('graphUser'));

  if (user) {
    // Hide the signin button
    signinButtonElm.style.display = "none";
    calendarElm.style.display = null;
    showTasksButtonElm.style.display = null;
    // Receive all lists and fill in the selector
    updateList();
  } else {
    // Show it up again
    signinButtonElm.style.display = null;
    calendarElm.style.display = "none";
    showTasksButtonElm.style.display = "none";
  }
}

updatePage();
