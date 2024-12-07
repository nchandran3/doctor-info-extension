# Doctor Info Chrome Extension

This Chrome extension automatically identifies healthcare professionals (doctors, RNs, NPs) on web pages and provides their educational and professional background information via tooltips using the OpenAI API.

## Features

- Automatically detects healthcare professional names on web pages
- Displays educational background, residency information, and board certifications in tooltips
- Caches results to minimize API calls
- Supports batch processing of multiple names
- Responsive and elegant tooltip design
- Configurable options for customizing the experience

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Configuration

Before using the extension, you need to configure it:

1. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
2. Right-click the extension icon in Chrome
3. Click "Options"
4. Configure the following settings:
   - **API Key**: Your OpenAI API key
   - **Batch Size**: Number of names to process in a single API call (1-20)
   - **Batch Delay**: Delay in milliseconds between processing batches
   - **Custom Prompt**: Customize the prompt sent to OpenAI to retrieve different or additional information

### Custom Prompt Template

You can customize the prompt template to retrieve different information about healthcare professionals. Use the `{names}` placeholder in your prompt where you want the list of names to be inserted. For example:

```
For each of these healthcare professionals: {names}, provide their:
1. Educational background
2. Areas of specialization
3. Research publications
4. Current hospital affiliations
```

## Usage

1. Visit any webpage containing healthcare professional names
2. Names of healthcare professionals will be automatically highlighted
3. Hover over a highlighted name to view their information in a tooltip
4. The information is cached for faster subsequent lookups

## Privacy & Security

- The extension only sends healthcare professional names to the OpenAI API
- Your API key is stored securely in Chrome's local storage
- No personal information is collected or stored

## Technical Details

- Uses Chrome Extension Manifest V3
- Implements MutationObserver for dynamic content support
- Includes error handling and rate limiting
- Responsive tooltip design with CSS animations
- Configurable batch processing and customizable prompts

## Support

For issues or feature requests, please open an issue in the repository.
