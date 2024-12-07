// Cache for storing retrieved information
const infoCache = new Map();

// Queue for collecting names to process in batches
let nameQueue = [];
let processingQueue = false;
// Regular expression for matching healthcare professional names
const namePatterns = [
    /\b(?:Dr\.|Doctor|MD|DDS|DMD|DC|DO|DPM|OD|PharmD|Ph.D|PsyD|APRN|ANP|PA|PA-C|CRNA|CNM|CN|CNS|CFNP|CPNP|CGC|CSC|CPON|CSP|CRNFA|CSW|LICSW|LCSW|LPC|LCPC|LMFT|LMHC|LPC|LADC)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,  // Matches "Dr. John Smith" or "Doctor Jane Doe" or "John Smith MD"
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s+(?:RN|NP|PA|PA-C|CRNA|CNM|CN|CNS|CFNP|CPNP|CGC|CSC|CPON|CSP|CRNFA|CSW|LICSW|LCSW|LPC|LCPC|LMFT|LMHC|LPC|LADC)\b/g,      // Matches "Jane Doe, RN" or "John Smith NP" or "John Smith PA"
    /\b(?:RN|NP|PA|PA-C|CRNA|CNM|CN|CNS|CFNP|CPNP|CGC|CSC|CPON|CSP|CRNFA|CSW|LICSW|LCSW|LPC|LCPC|LMFT|LMHC|LPC|LADC)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g        // Matches "RN Jane Doe" or "PA John Smith"
];

// Create and append tooltip container
const tooltipContainer = document.createElement('div');
tooltipContainer.id = 'doctor-info-tooltip';
tooltipContainer.style.display = 'none';
document.body.appendChild(tooltipContainer);

async function processNameQueue() {
    if (processingQueue || nameQueue.length === 0) return;
    
    processingQueue = true;
    
    // Get the batch size from storage
    const { batchSize = 50 } = await chrome.storage.local.get('batchSize');
    
    while (nameQueue.length > 0) {
        // Take up to batchSize names from the queue
        const nameBatch = nameQueue.splice(0, batchSize);
        
        // Send the batch to the background script
        const results = await chrome.runtime.sendMessage({
            action: "fetchInfo",
            names: nameBatch
        });
        
        // Cache the results
        for (const [name, info] of Object.entries(results)) {
            infoCache.set(name, info);
        }
    }
    
    processingQueue = false;
}

async function fetchInfo(name) {
    if (infoCache.has(name)) {
        return infoCache.get(name);
    }

    // Add name to queue if it's not already there
    if (!nameQueue.includes(name)) {
        nameQueue.push(name);
        processNameQueue(); // Try to process the queue
    }

    // Return a promise that resolves when the info is available
    return new Promise((resolve) => {
        const checkCache = () => {
            if (infoCache.has(name)) {
                resolve(infoCache.get(name));
            } else {
                setTimeout(checkCache, 100); // Check again in 100ms
            }
        };
        checkCache();
    });
}

function findAndWrapNames() {
    // Get all text nodes in the document
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip nodes that are children of healthcare-professional spans
                if (node.parentNode.classList && 
                    node.parentNode.classList.contains('healthcare-professional')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    const nodesToProcess = [];
    while (walker.nextNode()) {
        nodesToProcess.push(walker.currentNode);
    }

    const processedNames = new Set(); // Track unique names

    nodesToProcess.forEach(textNode => {
        let text = textNode.nodeValue;
        let matches = [];
        
        // Collect all matches from all patterns first
        namePatterns.forEach(pattern => {
            const patternMatches = Array.from(text.matchAll(pattern));
            matches.push(...patternMatches);
        });

        // Sort matches by index in descending order to process from end to start
        matches.sort((a, b) => b.index - a.index);

        // Process each match
        matches.forEach(match => {
            const fullMatch = match[0].trim();
            
            if (fullMatch && fullMatch.length > 0) {
                const span = document.createElement('span');
                span.className = 'healthcare-professional';
                span.setAttribute('data-name', fullMatch);
                span.textContent = fullMatch;

                const beforeText = text.substring(0, match.index);
                const afterText = text.substring(match.index + fullMatch.length);

                if (textNode.parentNode) {
                    const fragment = document.createDocumentFragment();
                    if (beforeText) {
                        fragment.appendChild(document.createTextNode(beforeText));
                    }
                    fragment.appendChild(span);
                    if (afterText) {
                        fragment.appendChild(document.createTextNode(afterText));
                    }
                    textNode.parentNode.replaceChild(fragment, textNode);
                    text = afterText;
                }

                // Add to queue if it's a new name
                if (!processedNames.has(fullMatch)) {
                    processedNames.add(fullMatch);
                    if (!nameQueue.includes(fullMatch)) {
                        nameQueue.push(fullMatch);
                    }
                }
            }
        });
    });

    // Start processing the queue
    processNameQueue();
}

function showTooltip(event) {
    const element = event.target;
    if (!element.classList.contains('healthcare-professional')) return;

    const name = element.getAttribute('data-name');
    const rect = element.getBoundingClientRect();

    tooltipContainer.style.position = 'fixed';
    tooltipContainer.style.left = `${rect.left}px`;
    tooltipContainer.style.top = `${rect.bottom + 5}px`;
    tooltipContainer.style.display = 'block';
    tooltipContainer.textContent = 'Loading...';

    fetchInfo(name).then(info => {
        tooltipContainer.innerHTML = info.replace(/\n/g, '<br>');
    });
}

function hideTooltip() {
    tooltipContainer.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', findAndWrapNames);
document.addEventListener('mouseover', showTooltip);
document.addEventListener('mouseout', hideTooltip);

// Observe DOM changes to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            findAndWrapNames();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
