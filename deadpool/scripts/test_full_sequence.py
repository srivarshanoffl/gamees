import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        print("Navigating to http://localhost:8089/deadpool.html...")
        page.goto("http://localhost:8089/deadpool.html")
        page.wait_for_timeout(1000)

        # Click Deploy
        start_btn = page.query_selector("#startBtn")
        if start_btn and start_btn.is_visible():
            start_btn.click()
            print("Clicked startBtn")

        # Wait until state is CONNECTION_FAILURE
        for _ in range(40):
            st = page.evaluate("() => document.getElementById('stState') ? document.getElementById('stState').textContent : ''")
            if "FAILURE" in st or "GAP" in st:
                print(f"Reached state: {st}")
                break
            time.sleep(0.5)

        time.sleep(1.0)
        # Trigger bypass button
        bypass_btn = page.query_selector("#bypassBtn")
        if bypass_btn:
            bypass_btn.click()
            print("Clicked bypassBtn")
        else:
            page.evaluate("() => typeof doBypass === 'function' && doBypass()")

        seen_states = set()
        start_t = time.time()
        while time.time() - start_t < 65:
            st = page.evaluate("() => document.getElementById('stState') ? document.getElementById('stState').textContent.trim() : ''")
            st_sub = page.evaluate("() => document.getElementById('stSub') ? document.getElementById('stSub').textContent.trim() : ''")
            charge = page.evaluate("() => document.getElementById('chargePct') ? document.getElementById('chargePct').textContent.trim() : ''")

            if st not in seen_states:
                seen_states.add(st)
                print(f"[{time.time()-start_t:.1f}s] State: {st} | Sub: {st_sub} | Charge: {charge}")

            if "FINAL OVERLOAD" in st and "overload" not in seen_states:
                seen_states.add("overload")
                time.sleep(0.5)
                page.screenshot(path="step7_final_overload.png")
                print("Captured step7_final_overload.png")

            if "MISSION COMPLETE" in st and "mission_done" not in seen_states:
                seen_states.add("mission_done")
                time.sleep(2.0) # wait for victory text and stats
                page.screenshot(path="step8_mission_complete.png")
                print("Captured step8_mission_complete.png")
                break

            time.sleep(0.15)

        browser.close()
        print("Sequence complete!")

if __name__ == "__main__":
    run()
