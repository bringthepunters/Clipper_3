let currentGig = {
  gigName: null,
  gigStartTime: null,
  gigStartDate: null,
  acts: [],
  prices: [],
  gigUrl: null,
  gigTimestamp: null,
  internalDescription: null,
};

let isUpdatingMenu = false;

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
    return;
  }

  isUpdatingMenu = true;

  chrome.contextMenus.removeAll(() => {
    createMenuItem("newGig", 'Add new gig: "%s"');
    if (!currentGig.gigStartTime) {
      createMenuItem("gigStartTime", "Set Gig Start Time");
    }
    if (!currentGig.gigStartDate) {
      createMenuItem("gigStartDate", "Set Gig Start Date");
    }
    const actMenuItemTitle =
      currentGig.acts.length === 0 ? "Add a headline act" : "Add another act";
    createMenuItem("addAct", actMenuItemTitle);
    createMenuItem("addPrice", "Add new price");
    createMenuItem("addDescription", "Add Internal Description");

    isUpdatingMenu = false;
  });
}

function resetGig(name, tab) {
  currentGig = {
    gigName: name,
    gigUrl: tab.url,
    gigTimestamp: new Date().toISOString(),
    gigStartTime: null,
    gigStartDate: null,
    acts: [],
    prices: [],
    internalDescription: null,
  };

  console.log("Gig name set:", name);
  console.log("Gig captured at URL:", currentGig.gigUrl);
  console.log("Gig captured at timestamp:", currentGig.gigTimestamp);
  console.log("Current Gig Data:", currentGig);

  saveCurrentGig();
  updateContextMenu();
}

// Function to handle setting gig details and resetting data for a new gig
function setGigDetails(menuItemId, detail) {
  if (menuItemId === "newGig") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resetGig(detail, tabs[0]);
    });
  } else {
    currentGig[menuItemId] = detail;
    console.log(`${menuItemId} set:`, detail);
    console.log("Current Gig Data:", currentGig);

    saveCurrentGig();
    updateContextMenu();
  }
}

function addAct(actDetail) {
  currentGig.acts.push(actDetail);
  console.log("Act added:", actDetail);

  saveCurrentGig();
  updateContextMenu();
}

function addPrice(content) {
  currentGig.prices.push(content);
  saveCurrentGig();
}

function grabKnownStyle1(text, tab) {
  const strings = text.split("\n");
  const indexes = { datetime: 1, name: 2, ticket: 8 };
  const [date, time] = strings[indexes.datetime].split(/\bAT\b|FROM/);
  const [start, end] = (time || "").split("-");
  const name = strings[indexes.name];
  const ticket = strings.find((x) => x.match(/Tickets|AU\$/));

  resetGig(name, tab);

  setGigDetails("gigStartDate", date);
  if (start) {
    setGigDetails("gigStartTime", start);
  }

  addPrice(ticket?.split("$")[1]);
}

function grabKnownStyle2(text, tab) {
  if (text) {
    const { offers, url, name, startDate } = JSON.parse(text)["@graph"][1];
    const [startDateActual, time] = startDate.split("T");
    resetGig(name, { url });
    setGigDetails("gigStartDate", startDateActual);
    setGigDetails("gigStartTime", time);
    offers.forEach((x) => addPrice(x.price));
  }
}

// Listener for when a context menu item is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addAct") {
    addAct(info.selectionText);
  } else if (info.menuItemId === "addPrice") {
    addPrice(info.selectionText);
  } else if (info.menuItemId === "addDescription") {
    const description = info.selectionText.substring(0, 500);
    setGigDetails("internalDescription", description);
  } else {
    setGigDetails(info.menuItemId, info.selectionText);
  }
});

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

// Keyboard shortcuts
chrome.commands.onCommand.addListener(function (command) {
  console.log(command);
  if (command === "add-new-gig") {
    applyWithSelection(resetGig);
  } else if (command === "add-act") {
    applyWithSelection(addAct);
  } else if (command === "add-price") {
    applyWithSelection(addPrice);
  } else if (command === "set-date") {
    applyWithSelection((text) => setGigDetails("gigStartDate", text));
  } else if (command === "set-time") {
    applyWithSelection((text) => setGigDetails("gigStartTime", text));
  } else if (command === "grab-known-style-1") {
    applyWithQuerySelector("[role=main]", grabKnownStyle1);
  } else if (command === "grab-known-style-2") {
    applyWithQuerySelector(
      "script[type='application/ld+json']",
      grabKnownStyle2,
    );
  }
});
