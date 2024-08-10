document.getElementById('saveButton').addEventListener('click', function () {
    const apiKey = document.getElementById('apiKey').value;

    if (apiKey) {
        chrome.storage.local.set({ apiKey: apiKey }, function () {
            alert('API key saved successfully!');
        });
    } else {
        alert('Please enter a valid API key.');
    }
});
