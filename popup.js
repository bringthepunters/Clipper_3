function toTitleCase(str) {
  if (!str) {
    return str;
  }
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["currentGig"], function (result) {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving from storage:", chrome.runtime.lastError);
      return;
    }

    console.log("Retrieved data from storage:", result);

    if (result.currentGig) {
      displayGigData(result.currentGig);
    } else {
      console.log("No gig data found in storage.");
    }
  });
});

function addData(label, data) {
  if (data) {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${label}:</strong> ${data}`;
    document.getElementById("gigDataContainer").appendChild(div);
  }
}

function displayGigData(gigData) {
  const container = document.getElementById("gigDataContainer");
  const meta = document.getElementById("meta");
  container.innerHTML = ""; 

  gigData.gigName = toTitleCase(gigData.gigName);
  gigData.acts = gigData.acts.map((act) => toTitleCase(act));

  addData("Gig Name", gigData.gigName);
  addData("Gig Start Time", gigData.gigStartTime);
  addData("Gig Date", gigData.gigStartDate);
  addData("Gig Start Date", gigData.gigStartDate);
  addData("Gig URL", gigData.gigUrl);
  addData("Timestamp", gigData.gigTimestamp);
  addData("Internal Description", gigData.internalDescription);

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
