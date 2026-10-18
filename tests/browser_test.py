from playwright.sync_api import sync_playwright
from pathlib import Path
import subprocess,time
root=Path(__file__).resolve().parents[1]
server=subprocess.Popen(['python','-m','http.server','8765','--bind','127.0.0.1'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 time.sleep(.5)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.goto('http://127.0.0.1:8765')
  page.wait_for_timeout(400)
  print('title',page.title())
  print('header',page.locator('h1').first.inner_text())
  page.screenshot(path=str(root/'screenshot_dashboard.png'))
  page.locator('.nav-item[data-view="tasks"]').click()
  print('tasks',page.locator('.task-row').count())
  page.screenshot(path=str(root/'screenshot_tasks.png'))
  page.locator('.nav-item[data-view="calendar"]').click()
  page.screenshot(path=str(root/'screenshot_calendar.png'))
  page.locator('.nav-item[data-view="analytics"]').click()
  page.screenshot(path=str(root/'screenshot_analytics.png'))
  page.locator('.btn[data-action="add"]').click()
  page.locator('#fTitle').fill('Презентация моего проекта')
  page.locator('#fSubject').fill('Проектная деятельность')
  page.locator('#fHours').fill('3')
  page.locator('#fDifficulty').select_option('4')
  page.locator('#fImportance').select_option('3')
  page.locator('#taskForm button[type="submit"]').click()
  assert 'Презентация моего проекта' in page.content()
  page.reload()
  assert 'Презентация моего проекта' in page.content()
  assert not errors, errors
  print('OK browser functions and persistence, no JS errors')
  browser.close()
finally:
 server.terminate();server.wait()
