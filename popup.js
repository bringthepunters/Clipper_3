function toTitleCase(str) {
  if (!str) {
    return str;
  }
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// This event listener ensures that the script runs after the popup's DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Attempt to retrieve the currentGig data from storage
  chrome.storage.local.get(["currentGig"], function (result) {
    // Log any errors that occur during the retrieval process
    if (chrome.runtime.lastError) {
      console.error("Error retrieving from storage:", chrome.runtime.lastError);
      return;
    }

    // Log the data that is retrieved from storage
    console.log("Retrieved data from storage:", result);

    // If currentGig data exists, call displayGigData to show it in the popup
    if (result.currentGig) {
      displayGigData(result.currentGig);
    } else {
      // If no data is found, log a message to the console
      console.log("No gig data found in storage.");
      // You could also update the popup's DOM to inform the user that no data was found
    }
  });
});


// This function creates a div element for each gig detail and appends it to the container
function addData(label, data) {
  if (data) {
    const div = document.createElement("div");
    // Make variable names bold by wrapping them in <strong> tags
    div.innerHTML = `<strong>${label}:</strong> ${data}`;
    document.getElementById("gigDataContainer").appendChild(div);
  }
}

// This function is responsible for taking the gig data object and calling addData for each detail
function displayGigData(gigData) {
  const container = document.getElementById("gigDataContainer");
  const meta = document.getElementById("meta");
  container.innerHTML = ""; // Clear previous content

  // Convert gig name to title case before storing
  gigData.gigName = toTitleCase(gigData.gigName);

  // Convert venue name to title case before storing
  gigData.venueName = toTitleCase(gigData.venueName);

  // Convert each act to title case before storing
  gigData.acts = gigData.acts.map((act) => toTitleCase(act));

  // Pass container as the first argument to addData
  addData("Gig Name", gigData.gigName);
  addData("Venue Name", gigData.venueName);
  addData("Gig Start Time", gigData.gigStartTime);
  addData("Gig Date", gigData.gigStartDate);
  addData("Gig Start Date", gigData.gigStartDate);
  addData("Gig URL", gigData.gigUrl);
  addData("Timestamp", gigData.gigTimestamp);
  addData("Internal Description", gigData.internalDescription); // Add Internal Description

  if (gigData.acts && gigData.acts.length > 0) {
    const actsDiv = document.createElement("div");
    actsDiv.innerHTML = `<strong>Acts:</strong> ${gigData.acts.join(" | ")}`;
    container.appendChild(actsDiv);
  }

  if (gigData.prices && gigData.prices.length > 0) {
    const pricesDiv = document.createElement("div");
    pricesDiv.innerHTML = `<strong>Prices:</strong> ${gigData.prices.join(" | ")}`;
    container.appendChild(pricesDiv);
  }

  const newUploadLink = document.createElement("a");
  newUploadLink.href = "https://lml.live/admin/uploads/new";
  newUploadLink.innerHTML = "CREATE UPLOAD";
  const selButton = document.createElement("button");
  selButton.innerHTML = "SELECT";
  selButton.onclick = () => {
    window.getSelection().selectAllChildren(container);
  };
  const newUploadContainer = document.createElement("div");
  meta.appendChild(newUploadContainer);
  meta.appendChild(selButton);
  newUploadContainer.appendChild(newUploadLink);
}
