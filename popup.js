document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(["currentGig"], function (result) {
      if (chrome.runtime.lastError) {
          console.error("Error retrieving from storage:", chrome.runtime.lastError);
          return;
      }

      if (result.currentGig) {
          displayGigData(result.currentGig);
      } else {
          console.log("No gig data found in storage.");
      }
  });
});

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

  if (gigData.genretags && gigData.genretags.length > 0) {
      addData("Genre Tags", gigData.genretags.join(" | "));
  }
}

function addData(label, data) {
  if (data) {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${label}:</strong> ${data}`;
      document.getElementById("gigDataContainer").appendChild(div);
  }
}
