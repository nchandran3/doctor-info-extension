// Default values for options
const DEFAULT_OPTIONS = {
    batchSize: 50,
    batchDelay: 2000,
    prompt: `For each of the following healthcare professionals, 
        provide their educational background (undergraduate and medical school), 
        residency information, and board certifications if available. 
        Format the response clearly for each person.
        
        {names}`
};

// Save options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const batchSize = parseInt(document.getElementById('batchSize').value) || DEFAULT_OPTIONS.batchSize;
    const batchDelay = parseInt(document.getElementById('batchDelay').value) || DEFAULT_OPTIONS.batchDelay;
    const prompt = document.getElementById('prompt').value || DEFAULT_OPTIONS.prompt;

    chrome.storage.local.set({
        openaiApiKey: apiKey,
        batchSize: batchSize,
        batchDelay: batchDelay,
        prompt: prompt
    }, () => {
        // Update status to let user know options were saved
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        status.className = 'status success';
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    });
}

// Restore options from chrome.storage
function restoreOptions() {
    chrome.storage.local.get({
        openaiApiKey: '',
        batchSize: DEFAULT_OPTIONS.batchSize,
        batchDelay: DEFAULT_OPTIONS.batchDelay,
        prompt: DEFAULT_OPTIONS.prompt
    }, (items) => {
        document.getElementById('apiKey').value = items.openaiApiKey;
        document.getElementById('batchSize').value = items.batchSize;
        document.getElementById('batchDelay').value = items.batchDelay;
        document.getElementById('prompt').value = items.prompt;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
