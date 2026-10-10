import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto("http://localhost:8089/deadpool.html")
        page.wait_for_timeout(1000)

        # Start
        start_btn = page.query_selector("#startBtn")
        if start_btn: start_btn.click()

        # Wait for gap failure
        page.wait_for_selector("#bypassBtn", state="visible", timeout=30000)
        time.sleep(1)
        page.click("#bypassBtn")

        # Wait for end screen
        print("Waiting for victory endScreen...")
        page.wait_for_selector("#endScreen:not(.hidden)", timeout=60000)
        time.sleep(2.5) # allow end2 and endStats to fade in
        page.screenshot(path="step8_mission_complete.png")
        print("Captured step8_mission_complete.png successfully!")
        browser.close()

if __name__ == "__main__":
    run()
