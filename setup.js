document.getElementById("saveApiKeyButton").addEventListener("click", function() {
    const apiKey = document.getElementById("apiKeyInput").value;

    if (apiKey) {
        chrome.storage.local.set({ openaiApiKey: apiKey }, function() {
            console.log("API key saved successfully!");
            alert("API key saved successfully!");
        });
    } else {
        console.error("No API key entered.");
        alert("Please enter a valid API key.");
    }
});
