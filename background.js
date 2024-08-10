let currentGig = {
  venueName: null,
  gigStartTime: null,
  gigStartDate: null,
  acts: [],
  prices: [],
  gigUrl: null,
  gigTimestamp: null,
  internalDescription: null, // Added internalDescription
};

let isUpdatingMenu = false; // Track if the updateContextMenu function is already running

// Define the saveCurrentGig function here
function saveCurrentGig() {
  chrome.storage.local.set({ currentGig: currentGig }, function () {
    console.log("currentGig data saved to storage");
  });
}

function createMenuItem(id, title) {
  chrome.contextMenus.create({
    id: id,
    title: title,
    contexts: ["selection"],
  });
}

// Function to update context menu
function updateContextMenu() {
  if (isUpdatingMenu) {
    console.log("Update already in progress, skipping...");
    return; // Skip if an update is already in progress
  }

  isUpdatingMenu = true; // Set the flag to indicate the update is starting

  chrome.contextMenus.removeAll(() => {
    // Always create the "Add new gig" option
    createMenuItem("newGig", 'Add new gig: "%s"');
    // Create other options based on the currentGig state
    if (!currentGig.venueName) {
      createMenuItem("venueName", "Set Venue Name");
    }
    if (!currentGig.gigStartTime) {
      createMenuItem("gigStartTime", "Set Gig Start Time");
    }
    if (!currentGig.gigStartDate) {
      createMenuItem("gigStartDate", "Set Gig Start Date");
    }
    // Option to add acts
    const actMenuItemTitle =
      currentGig.acts.length === 0 ? "Add a headline act" : "Add another act";
    createMenuItem("addAct", actMenuItemTitle);
    createMenuItem("addPrice", "Add new price");
    createMenuItem("addDescription", "Add Internal Description"); // Added menu item for internal description

    isUpdatingMenu = false; // Reset the flag as the update is complete
  });
}

function resetGig(name, tab) {
  // Setting the new gig details and capturing the URL and timestamp
  currentGig = {
    gigName: name,
    gigUrl: tab.url,
    gigTimestamp: new Date().toISOString(),
    venueName: null,
    gigStartTime: null,
    gigStartDate: null,
    acts: [],
    prices: [],
    internalDescription: null, // Reset internal description
  };

  console.log("Gig name set:", name);
  console.log("Gig captured at URL:", currentGig.gigUrl);
  console.log("Gig captured at timestamp:", currentGig.gigTimestamp);
  console.log("Current Gig Data:", currentGig);

  saveCurrentGig(); // Save the updated currentGig to storage
  updateContextMenu(); // Update the context menu
}

// Function to handle setting gig details and resetting data for a new gig
function setGigDetails(menuItemId, detail) {
  if (menuItemId === "newGig") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resetGig(detail, tabs[0]);
    });
  } else {
    // Handling updates to gig details other than 'newGig'
    currentGig[menuItemId] = detail;
    console.log(`${menuItemId} set:`, detail);
    console.log("Current Gig Data:", currentGig);

    saveCurrentGig(); // Save the updated currentGig to storage
    updateContextMenu(); // Reflect the changes in the context menu
  }
}

function addAct(actDetail) {
  // Add the act detail to the acts array in the currentGig object
  currentGig.acts.push(actDetail);
  console.log("Act added:", actDetail);

  // Save the updated currentGig object to chrome.storage.local
  saveCurrentGig();

  // Optionally, update the context menu or perform other updates
  updateContextMenu();
}

function addPrice(content) {
  currentGig.prices.push(content);
  saveCurrentGig();
}

// Listener for when a context menu item is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addAct") {
    addAct(info.selectionText);
  } else if (info.menuItemId === "addPrice") {
    addPrice(info.selectionText);
  } else if (info.menuItemId === "addDescription") {
    // Ensure the internal description does not exceed 500 characters
    const description = info.selectionText.substring(0, 500);
    setGigDetails("internalDescription", description);
  } else {
    setGigDetails(info.menuItemId, info.selectionText);
  }
});

function setDate(text) {
  setGigDetails("gigStartDate", text);
}

function setTime(text) {
  setGigDetails("gigStartTime", text);
}

function setVenue(text) {
  setGigDetails("venueName", text);
}

function grabKnownStyle1(text, tab) {
  const strings = text.split("\n");
  const indexes = { datetime: 1, name: 2, ticket: 8 };
  const [date, time] = strings[indexes.datetime].split(/\bAT\b|FROM/);
  const [start, end] = (time || "").split("-");
  const name = strings[indexes.name];
  const ticket = strings.find((x) => x.match(/Tickets|AU\$/));

  resetGig(name, tab);

  setDate(date);
  if (start) {
    setTime(start);
  }

  addPrice(ticket?.split("$")[1]);
}

function grabKnownStyle2(text, tab) {
  if (text) {
    const { offers, url, name, startDate } = JSON.parse(text)["@graph"][1];
    const [startDateActual, time] = startDate.split("T");
    resetGig(name, { url });
    setDate(startDateActual);
    setTime(time);
    offers.forEach((x) => addPrice(x.price));
  }
}
// Create the context menu when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenu();
});

function getSelectedContent() {
  return window.getSelection().toString();
}
function querySelector(query) {
  return document.querySelector(query).innerText;
}
function applyWithQuerySelector(selector, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    chrome.scripting
      .executeScript({
        target: { tabId: tabs[0].id },
        func: querySelector,
        args: [selector],
      })
      .then((results) => {
        callback(results[0].result, tabs[0]);
      });
  });
}
function applyWithSelection(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    chrome.scripting
      .executeScript({
        target: { tabId: tabs[0].id },
        func: getSelectedContent,
        args: [],
      })
      .then((results) => {
        callback(results[0].result, tabs[0]);
      });
  });
}

//keyboard shortcuts

chrome.commands.onCommand.addListener(function (command) {
  console.log(command);
  if (command === "add-new-gig") {
    applyWithSelection(resetGig);
  } else if (command === "add-act") {
    applyWithSelection(addAct);
  } else if (command === "add-price") {
    applyWithSelection(addPrice);
  } else if (command === "set-date") {
    applyWithSelection(setDate);
  } else if (command === "set-time") {
    applyWithSelection(setTime);
  } else if (command === "set-venue") {
    applyWithSelection(setVenue);
  } else if (command === "grab-known-style-1") {
    applyWithQuerySelector("[role=main]", grabKnownStyle1);
  } else if (command === "grab-known-style-2") {
    applyWithQuerySelector(
      "script[type='application/ld+json']",
      grabKnownStyle2,
    );
  }
});
