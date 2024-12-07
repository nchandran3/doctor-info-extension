#!/usr/bin/env python3

import os
import sys
import time
import threading
import http.server
import socketserver
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

# Add the project root to the Python path
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT))

# Load environment variables
load_dotenv(PROJECT_ROOT / 'tests' / 'config' / 'test.env')

class TestHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        directory = str(PROJECT_ROOT / 'tests' / 'fixtures')
        super().__init__(*args, directory=directory, **kwargs)
        
    def log_message(self, format: str, *args: Any) -> None:
        # Suppress log messages for cleaner output
        pass

class HTTPServerThread(threading.Thread):
    def __init__(self, port):
        threading.Thread.__init__(self)
        self.port = port
        self.server = None

    def run(self):
        handler = TestHTTPRequestHandler
        self.server = socketserver.TCPServer(("", self.port), handler)
        print(f"🌐 Started test server at http://localhost:{self.port}")
        self.server.serve_forever()

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()

def setup_chrome_with_extension():
    # Get the absolute path of the extension
    extension_path = str(PROJECT_ROOT)
    
    # Set up Chrome options
    chrome_options = Options()
    
    # Use a custom profile directory for testing
    profile_dir = PROJECT_ROOT / 'tests' / os.getenv('CHROME_PROFILE_DIR')
    chrome_options.add_argument(f'user-data-dir={profile_dir}')
    
    # Load the extension
    chrome_options.add_argument(f'--load-extension={extension_path}')
    
    # Additional options for testing
    chrome_options.add_argument('--start-maximized')
    chrome_options.add_argument('--no-first-run')
    chrome_options.add_argument('--no-default-browser-check')
    
    try:
        # Create WebDriver instance with specific ChromeDriver options
        service = Service()
        driver = webdriver.Chrome(
            service=service,
            options=chrome_options
        )
        return driver
    except Exception as e:
        print(f"Error creating WebDriver: {str(e)}")
        raise

def get_extension_id(driver):
    """Get the extension ID by finding our extension by name"""
    # Navigate to extensions page
    driver.get("chrome://extensions")
    
    try:
        # Wait for extensions-manager to be present
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script("return document.querySelector('extensions-manager') !== null")
        )
        
        # Script to find our extension by name and get its ID
        extension_id = driver.execute_script("""
            const managerRoot = document.querySelector('extensions-manager').shadowRoot;
            const itemList = managerRoot.querySelector('extensions-item-list').shadowRoot;
            const items = itemList.querySelectorAll('extensions-item');
            
            for (const item of items) {
                const nameElement = item.shadowRoot.querySelector('#name-and-version');
                if (nameElement && nameElement.textContent.includes('Doctor Info Extractor')) {
                    return item.id;
                }
            }
            return null;
        """)
        
        if not extension_id:
            raise Exception("Could not find Doctor Info Extractor extension")
            
        print(f"📦 Found extension ID: {extension_id}")
        return extension_id
    except TimeoutException:
        raise Exception("Timeout waiting for extensions page to load")

def configure_extension(driver, api_key):
    """Configure the extension with the API key and default settings"""
    try:
        # Get the extension ID
        extension_id = get_extension_id(driver)
        
        # Navigate to options page with the correct extension ID
        options_url = f"chrome-extension://{extension_id}/options.html"
        print(f"🔧 Opening options page: {options_url}")
        driver.get(options_url)
        
        # Wait for the API key input field to be present
        api_key_input = WebDriverWait(driver, 10).until(
            lambda d: d.find_element(By.ID, "apiKey")
        )
        
        # Wait for the save button to be present
        save_button = WebDriverWait(driver, 10).until(
            lambda d: d.find_element(By.ID, "save")
        )
        
        # Set the API key and save
        api_key_input.clear()
        api_key_input.send_keys(api_key)
        save_button.click()
        
        # Wait for save confirmation (you might want to add a success message element in your options.html)
        print("✅ Extension configured successfully")
    except TimeoutException as e:
        print(f"❌ Error: Timeout while configuring extension: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Error configuring extension: {str(e)}")
        raise

def main():
    # Get configuration
    port = int(os.getenv('TEST_SERVER_PORT', 8000))
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("⚠️  Warning: OPENAI_API_KEY not set in test.env")
    
    # Start HTTP server in a separate thread
    server_thread = HTTPServerThread(port)
    server_thread.daemon = True
    server_thread.start()
    
    try:
        # Setup Chrome with the extension
        print("🚀 Starting Chrome with extension...")
        driver = setup_chrome_with_extension()
        
        # Configure the extension
        if api_key:
            print("⚙️  Configuring extension...")
            configure_extension(driver, api_key)
        
        # Navigate to test page
        test_url = f"http://localhost:{port}/test.html"
        print(f"📄 Opening test page: {test_url}")
        driver.get(test_url)
        
        print("\n✨ Test environment is ready!")
        print("Press Ctrl+C to stop the test environment")
        
        # Keep the script running
        while True:
            time.sleep(1)
    
    except KeyboardInterrupt:
        print("\n🛑 Shutting down test environment...")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        # Cleanup
        try:
            driver.quit()
        except:
            pass
        server_thread.stop()
        print("👋 Test environment stopped")

if __name__ == "__main__":
    main()
