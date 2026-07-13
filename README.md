# LeetCode Solved Exporter

A Chrome Extension that exports all your solved LeetCode questions to an Excel file.

## Features
- Fetches all your solved LeetCode questions directly from your profile.
- Exports the data into an easy-to-read Excel file format.
- Simple, one-click operation via an extension popup.

## Installation
1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click on **Load unpacked** and select the folder containing this extension.
5. The extension should now be installed and visible in your extensions list.

## Usage
1. Make sure you are logged into your [LeetCode](https://leetcode.com/) account.
2. Click on the extension icon in your browser toolbar.
3. Click the export button in the popup.
4. An Excel file containing your solved questions will be downloaded automatically.

## Permissions
- **storage**: To save extension settings and cache data.
- **downloads**: To download the exported Excel file to your computer.
- **host_permissions (`https://leetcode.com/*`)**: To fetch the solved questions data from the LeetCode API.

## License
MIT
