# Testing Environment for Doctor Info Extension

This directory contains the testing environment for the Doctor Info Chrome Extension.

## Directory Structure

```
tests/
├── config/           # Configuration files
│   └── test.env     # Environment variables for testing
├── fixtures/         # Test data files
│   └── test.html    # Sample webpage for testing
├── scripts/         # Test scripts
│   └── test_wrapper.py  # Main test wrapper script
├── venv/            # Virtual environment (created automatically)
└── requirements.txt # Python dependencies for testing
```

## Setup

1. Create and activate the virtual environment:
```bash
# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Unix/macOS
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
- Copy `config/test.env.example` to `config/test.env`
- Edit `test.env` and set your OpenAI API key

## Running Tests

1. Activate the virtual environment (if not already activated):
```bash
source venv/bin/activate
```

2. Run the test wrapper:
```bash
python scripts/test_wrapper.py
```

The script will:
- Start a local HTTP server serving the test fixtures
- Launch Chrome with the extension loaded
- Configure the extension with your API key
- Navigate to the test page

## Test Fixtures

The `fixtures/` directory contains sample web pages for testing different scenarios:
- `test.html`: Contains various healthcare professional names in different formats

## Adding New Tests

1. Add new test fixtures to the `fixtures/` directory
2. Update the test wrapper script as needed
3. Document any new test scenarios in this README

## Cleanup

- Press Ctrl+C to stop the test environment
- The script will automatically clean up:
  - Close Chrome
  - Stop the HTTP server
  - Remove temporary files
