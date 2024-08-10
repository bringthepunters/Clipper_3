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

function showTemporaryMessage(message, isError = false) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = message;
  messageDiv.style.position = "fixed";
  messageDiv.style.bottom = "20px";
  messageDiv.style.left = "50%";
  messageDiv.style.transform = "translateX(-50%)";
  messageDiv.style.backgroundColor = isError ? "red" : "green";
  messageDiv.style.color = "white";
  messageDiv.style.padding = "10px 20px";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.zIndex = "1000";
  document.body.appendChild(messageDiv);

  setTimeout(() => {
      messageDiv.remove();
  }, 2000); // Message disappears after 2 seconds
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
      addData("Genre Tags", gigData.genretags.join("\n")); // Ensures tags are on separate lines
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
