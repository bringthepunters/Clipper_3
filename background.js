let currentGig = {
    gigName: null,
    gigStartTime: null,
    gigStartDate: null,
    acts: [],
    prices: [],
    gigUrl: null,
    gigTimestamp: null,
    internalDescription: null,
    genretags: [],
};

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

        // Only show "Add Internal Description" if it hasn't been added yet
        if (!currentGig.internalDescription) {
            createMenuItem("addDescription", "Add Internal Description");
        }

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
        genretags: [],
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
    Given the gig description provided, generate a list of two music genre tags that describe music genres mentioned or implied. The first tag MUST be from the list below, and the second tag should be a one or two-word description that best fits the description. Avoid redundant phrases like "jazz genre" or duplicating the word "genre" in any tag. The second tag may be from the list but does not have to be. It can be quirky, but it should fit the description and not be negative.

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
        if (!apiKey) {
            console.error("No API key available, cannot send request to GPT-4o.");
            return;
        }
        
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
                max_tokens: 50,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("GPT-4o Response:", data); // Debug log
            let tags = data.choices[0].message.content.trim().split("\n").map(tag => tag.trim());

            // Ensure each tag is properly formatted with "genre: " prefix and remove any double prefixes
            tags = tags.map(tag => `genre: ${tag.replace(/^genre: /i, '').trim()}`);

            console.log("Parsed Tags:", tags); // Debug log
            currentGig.genretags = tags; // Store tags as an array
            saveCurrentGig();
            updateContextMenu(); // Update context menu to reflect new tags if necessary
            showTagAddedNotification(); // Show notification when tags are added
            callback(tags.join("\n"));
        })
        .catch(error => console.error("Error with GPT-4o API:", error));
    });
}

function displayGigData(gigData) {
    const container = document.getElementById("gigDataContainer");
    container.innerHTML = ""; // Clear previous content

    addData("Gig Name", gigData.gigName);
    addData("Gig Start Time", gigData.gigStartTime);
    addData("Gig Date", gigData.gigStartDate);
    addData("Gig Start Date", gigData.gigStartDate);
    addData("Gig URL", gigData.gigUrl);
    addData("Timestamp", gigData.gigTimestamp);
    addData("Internal Description", gigData.internalDescription);

    if (gigData.acts && gigData.acts.length > 0) {
        addData("Acts", gigData.acts.join(" | "));
    }

    if (gigData.prices && gigData.prices.length > 0) {
        addData("Prices", gigData.prices.join(" | "));
    }

    // Display genre tags without the "Genre Tags:" label
    if (gigData.genretags && gigData.genretags.length > 0) {
        const genreDiv = document.createElement("div");
        genreDiv.innerHTML = gigData.genretags.join("<br>"); // Ensures tags are on separate lines
        container.appendChild(genreDiv);
    } else {
        console.log("No genre tags found in gigData."); // Debug log
    }
}

function addData(label, data) {
    if (data) {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${label}:</strong> ${data}`;
        document.getElementById("gigDataContainer").appendChild(div);
    }
}

function showTagAddedNotification() {
    const notificationDiv = document.createElement("div");
    notificationDiv.textContent = "Genre tags added successfully!";
    notificationDiv.style.position = "fixed";
    notificationDiv.style.bottom = "20px";
    notificationDiv.style.right = "20px";
    notificationDiv.style.backgroundColor = "#4CAF50"; // Green background for success
    notificationDiv.style.color = "white";
    notificationDiv.style.padding = "10px 20px";
    notificationDiv.style.borderRadius = "5px";
    notificationDiv.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    notificationDiv.style.zIndex = "1000";
    notificationDiv.style.opacity = "0";
    notificationDiv.style.transition = "opacity 0.5s";

    document.body.appendChild(notificationDiv);

    // Fade in the notification
    setTimeout(() => {
        notificationDiv.style.opacity = "1";
    }, 100); // Slight delay for a smooth fade-in effect

    // Automatically remove the notification after 3 seconds with fade out
    setTimeout(() => {
        notificationDiv.style.opacity = "0";
        setTimeout(() => {
            notificationDiv.remove();
        }, 500); // Wait for the fade-out to complete before removing
    }, 3000);
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
            currentGig.genretags = tags.split("\n"); // Store tags as an array
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

function showTagAddedNotification() {
    const notificationDiv = document.createElement("div");
    notificationDiv.textContent = "Genre tags added successfully!";
    notificationDiv.style.position = "fixed";
    notificationDiv.style.bottom = "20px";
    notificationDiv.style.right = "20px";
    notificationDiv.style.backgroundColor = "#4CAF50"; // Green background for success
    notificationDiv.style.color = "white";
    notificationDiv.style.padding = "10px 20px";
    notificationDiv.style.borderRadius = "5px";
    notificationDiv.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)";
    notificationDiv.style.zIndex = "1000";
    notificationDiv.style.opacity = "0";
    notificationDiv.style.transition = "opacity 0.5s";

    document.body.appendChild(notificationDiv);

    // Fade in the notification
    setTimeout(() => {
        notificationDiv.style.opacity = "1";
    }, 100); // Slight delay for a smooth fade-in effect

    // Automatically remove the notification after 3 seconds with fade out
    setTimeout(() => {
        notificationDiv.style.opacity = "0";
        setTimeout(() => {
            notificationDiv.remove();
        }, 500); // Wait for the fade-out to complete before removing
    }, 3000);
}

function getAPIKey(callback) {
    chrome.storage.local.get("openaiApiKey", function (result) {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving API key from storage:", chrome.runtime.lastError);
            callback(null);
            return;
        }
        
        const apiKey = result.openaiApiKey;
        if (apiKey) {
            callback(apiKey);
        } else {
            console.error("No API key found in storage.");
            callback(null);
        }
    });
}
