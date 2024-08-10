Chrome Extension Setup and Usage Guide
1. Loading the Extension
Prepare Your Files:

Ensure all necessary files (manifest.json, background.js, popup.html, setup.html, etc.) are in a single directory.
Open Chrome Extensions Page:

In your Chrome browser, navigate to chrome://extensions/.
Alternatively, click the three dots in the top-right corner, go to More Tools, and then select Extensions.
Enable Developer Mode:

In the top right corner of the Extensions page, toggle the Developer mode switch to the "on" position.
Load Unpacked Extension:

Click the Load unpacked button that appears after enabling Developer mode.
In the file dialog that opens, navigate to the directory where your extension files are located and select the folder.
Your extension should now appear in the list of installed extensions.
2. Running the setup.html Page
Accessing the Extension:

Once the extension is loaded, you should see the extension icon appear in the Chrome toolbar.
Open the Extensions Management Interface:

Go back to the chrome://extensions/ page.
Locate your extension and click on the background page link (if you need to check background.js execution) or the index.html (or setup.html) file to manage your extension settings.
Open the Setup Page:

Click on the Details button under your extension on the chrome://extensions/ page.
Scroll down to the Extension Options section, and you should see a link to setup.html (or the setup page of your extension).
Click on the link to open setup.html in a new tab.
Enter the API Key:

On the setup.html page, you will be prompted to enter your OpenAI API key. Enter the key and click Save to store it locally.
Using the Extension:

Your extension is now set up! You can start using it by selecting text on web pages and using the right-click context menu options added by the extension.
Troubleshooting Tips
No API Key Stored:
If you see an error related to "No API key found in storage," ensure you have correctly entered and saved your API key in the setup.html page.
Reload the Extension:
If any changes are made to the extension files, you need to reload the extension by going to chrome://extensions/ and clicking the Reload button for your extension.