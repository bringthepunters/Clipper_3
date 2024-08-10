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

  // Add event listener for the copy button
  document.getElementById("copyButton").addEventListener("click", function () {
      const gigDataContainer = document.getElementById("gigDataContainer");
      const range = document.createRange();
      range.selectNodeContents(gigDataContainer);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      try {
          document.execCommand("copy");
          showTemporaryMessage("Copied to clipboard!"); // Show message
      } catch (err) {
          showTemporaryMessage("Failed to copy data.", true); // Show error message
      }

      selection.removeAllRanges(); // Clear selection after copying
  });
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
        gigData.genretags.forEach(tag => {
            const div = document.createElement("div");
            div.textContent = tag;
            container.appendChild(div);
        });
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
