document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const exportBtn = document.getElementById('exportBtn');
  const statusDiv = document.getElementById('status');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const progressBar = document.getElementById('progressBar');

  // Load saved username
  chrome.storage.local.get(['leetcodeUsername'], (result) => {
    if (result.leetcodeUsername) {
      usernameInput.value = result.leetcodeUsername;
    }
  });

  exportBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) {
      statusDiv.textContent = 'Please enter your LeetCode username.';
      statusDiv.style.color = 'red';
      return;
    }

    // Save username
    chrome.storage.local.set({ leetcodeUsername: username });

    exportBtn.disabled = true;
    statusDiv.textContent = 'Starting export...';
    statusDiv.style.color = '#333';
    
    progressBarContainer.style.display = 'block';
    progressBar.style.width = '0%';

    // Trigger background worker
    chrome.runtime.sendMessage({ type: 'start_export', username: username });
  });

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'progress') {
      statusDiv.textContent = message.message;
      if (message.total) {
        const percent = Math.min(100, Math.round((message.fetched / message.total) * 100));
        progressBar.style.width = `${percent}%`;
      }
    } else if (message.type === 'complete') {
      statusDiv.textContent = `Completed! ${message.message}`;
      statusDiv.style.color = 'green';
      exportBtn.disabled = false;
      progressBar.style.width = '100%';
      
      // Store the result globally so we can inspect it during testing
      window.lastExportedData = message.data;
      console.log('Exported Data:', message.data);
      
      downloadExcelSheet(message.data);
      
    } else if (message.type === 'error') {
      statusDiv.textContent = `Error: ${message.message}`;
      statusDiv.style.color = 'red';
      exportBtn.disabled = false;
      progressBarContainer.style.display = 'none';
    }
  });
});

function downloadExcelSheet(data) {
  // Create CSV content with headers
  let csvContent = "Question Number,Question Heading\n";
  
  // Sort data numerically by question ID
  data.sort((a, b) => parseInt(a.frontendQuestionId) - parseInt(b.frontendQuestionId));

  data.forEach(q => {
    // Escape double quotes in title just in case
    let title = q.title.replace(/"/g, '""');
    csvContent += `"${q.frontendQuestionId}","${title}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: "leetcode_solved_questions.csv",
    saveAs: true
  });
}
