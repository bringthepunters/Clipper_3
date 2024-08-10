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

// Define the getAPIKey function
function getAPIKey(callback) {
  chrome.storage.local.get(['apiKey'], function(result) {
      if (result.apiKey) {
          callback(result.apiKey);
      } else {
          console.error("API key not found");
      }
  });
}

let isUpdatingMenu = false;

function saveCurrentGig() {
  chrome.storage.local.set({ currentGig: currentGig }, function () {
      console.log("currentGig data saved to storage:", currentGig);
  });
}

function createMenuItem(id, title) {
  chrome.contextMenus.create({
      id: id,
      title: title,
      contexts: ["selection"],
  });
}

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

function sendToChatGPT(internalDescription, callback) {
  const gig_gist_prompt = `
  Given the gig description provided, generate a list of two music genre tags that describe music genres mentioned or implied. The first tag MUST be from the list below, and the second tag should be a one or two-word description that best fits the description. The second tag may be from the list but does not have to be. It can be quirky, but it should fit the description and not be negative.

  Format output like this:
  genre: tag 1
  genre: tag 2

  Rock
  Pop
  Hip-Hop
  R&B and Soul
  Jazz
  Classical
  Electronic
  Country
  Metal
  Folk
  Blues
  Reggae
  Dub
  Latin
  World
  Gospel
  Dance
  Punk
  Alternative
  Experimental
  Indie
  Ambient
  Hardcore
  Industrial
  Garage
  Trance
  House
  Techno
  Drum and Bass
  Dubstep
  Funk
  Chill
  Disco
  Opera
  Swing
  Acoustic
  New Wave
  DJ
  Covers
  `;

  const message = `${gig_gist_prompt}\n\nDescription: ${internalDescription}`;

  console.log("Sending message to GPT-4o:", message); // Debug log

  getAPIKey(function(apiKey) {
      fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                  { role: "system", content: "You are a helpful assistant with an interest in live music performances." },
                  { role: "user", content: message }
              ],
              response_format: { "type": "text" },
              max_tokens: 50,
          }),
      })
      .then(response => response.json())
      .then(data => {
          console.log("GPT-4o Response:", data); // Debug log
          const tags = data.choices[0].message.content.trim().split("\n");
          console.log("Parsed Tags:", tags); // Debug log
          callback(tags);
      })
      .catch(error => console.error("Error with GPT-4o API:", error));
  });
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addAct") {
      addAct(info.selectionText);
  } else if (info.menuItemId === "addPrice") {
      addPrice(info.selectionText);
  } else if (info.menuItemId === "addDescription") {
      let description = info.selectionText.substring(0, 500);
      description = description.replace(/(\r\n|\n|\r)/gm, " "); // Replace all line breaks with a space

      setGigDetails("internalDescription", description);

      sendToChatGPT(description, (tags) => {
          currentGig.genretags = tags;
          saveCurrentGig();
          updateContextMenu(); // Update context menu to reflect new tags if necessary
      });
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
