// Queue for batch processing
let nameQueue = [];
let apiKey = '';
let batchSize = 5;
let batchDelay = 2000;
let promptTemplate = `For each of the following healthcare professionals, 
    provide their educational background (undergraduate and medical school), 
    residency information, and board certifications if available. 
    Format the response clearly for each person.

    {names}`;

// Load configuration from storage
function loadConfig() {
    chrome.storage.local.get({
        openaiApiKey: apiKey,
        batchSize,
        batchDelay,
        prompt: promptTemplate
    }, function(config) {
        apiKey = config.openaiApiKey;
        batchSize = config.batchSize;
        batchDelay = config.batchDelay;
        promptTemplate = config.prompt;
    });
}

// Load config initially and listen for changes
loadConfig();
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.openaiApiKey) apiKey = changes.openaiApiKey.newValue;
        if (changes.batchSize) batchSize = changes.batchSize.newValue;
        if (changes.batchDelay) batchDelay = changes.batchDelay.newValue;
        if (changes.prompt) promptTemplate = changes.prompt.newValue;
    }
});

async function processNameBatch(names) {
    if (!apiKey) {
        return names.reduce((acc, name) => {
            acc[name] = "Please set your OpenAI API key in the extension options";
            return acc;
        }, {});
    }

    try {
        const prompt = promptTemplate.replace('{names}', names.join("\n"));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the response and create individual entries for each name
        const results = {};
        names.forEach(name => {
            const namePattern = new RegExp(`${name}[:\\n]([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
            const match = content.match(namePattern);
            results[name] = match ? match[1].trim() : "Information not found";
        });

        return results;
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        return names.reduce((acc, name) => {
            acc[name] = "Error retrieving information";
            return acc;
        }, {});
    }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchInfo") {
        const names = request.names || [request.name]; // Support both single name and batch
        processNameBatch(names)
            .then(results => {
                sendResponse(results);
            })
            .catch(error => {
                console.error('Error processing names:', error);
                sendResponse({
                    error: "Error processing healthcare professional information"
                });
            });
        return true; // Will respond asynchronously
    }
});
