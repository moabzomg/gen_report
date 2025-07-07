from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import csv
import time

# Credentials
email="myemail@gmail.com"
password="mypassword"
url="http://example.com"
module="mymodule"

driver = webdriver.Chrome()
driver.get(url)
wait = WebDriverWait(driver, 10)

# Login
wait.until(EC.presence_of_element_located((By.NAME, "identifier"))).send_keys(email)
wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input.button.button-primary[type='submit'][value='Next']"))).click()
wait.until(EC.presence_of_element_located((By.NAME, "credentials.passcode"))).send_keys(password)
wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input.button.button-primary[type='submit'][value='Verify']"))).click()

# Accept Cookies
try:
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.btn--primary.close-cookie-all"))).click()
except:
    print("No cookie banner found.")

# Navigate to module
link = None
while not link:
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='clmslearningpathdetails.prmain']")))
    links = driver.find_elements(By.CSS_SELECTOR, "a[href*='clmslearningpathdetails.prmain']")
    for l in links:
        if l.text.strip() == module:
            link = l
            break
    if link:
        link.click()
        break

# Find "Guided Learning"
records = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".tbl-lp-details .tiles-layout")))
for record in records:
    try:
        course_name_element = record.find_element(By.CSS_SELECTOR, "a[href*='clmsCourseDetails.prMain']")
        if "Guided Learning" in course_name_element.text:
            access_button = record.find_element(By.CSS_SELECTOR, "a[title='Access Content']")
            access_button.click()
            break
    except:
        continue

# Switch to new tab
time.sleep(2)
driver.switch_to.window(driver.window_handles[-1])
while "player/play" in driver.current_url:
    try:
        continue_button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.btn.btn-primary[href*='player/play']")))
        continue_button.click()
    except:
        break

time.sleep(2)
if "knowledgequity.com.au/dashboard" in driver.current_url:
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".MuiButtonBase-root.MuiCardActionArea-root.css-1m5f78l"))).click()

# Expand quizzes
time.sleep(2)
buttons = driver.find_elements(By.CSS_SELECTOR, "button svg[data-testid='KeyboardArrowDownIcon']")
for button in buttons:
    button.click()

time.sleep(5)  # Wait for all questions to load
rows = driver.find_elements(By.CSS_SELECTOR, "main>div:nth-child(2)>div>div>table>tbody>tr")
with open("questionBank.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Quiz title", "HTML of the question", "Answer", "Options, separated by |", "HTML of the explanation", "Question type"])
    
    name = ""
    for i, row in enumerate(rows):
        if i % 2 == 0:
            name = row.find_element(By.CSS_SELECTOR, "th > span").text.strip()
        else:
            divs = row.find_elements(By.CSS_SELECTOR, "td > div > div > div > div > div > div")
            index = 2 if name.endswith("Test") else 1
            questions = divs[index].find_elements(By.CSS_SELECTOR, ":scope > div")
            for q in questions:
                q_div = q.find_elements(By.CSS_SELECTOR, ":scope>div>div>div>div")
                question_html = q_div[0].find_element(By.CSS_SELECTOR, ":scope>div").get_attribute("innerHTML")
                answer = q_div[2].find_element(By.CSS_SELECTOR, ":scope>p").text.strip()[-1]
                options = q_div[2].find_element(By.CSS_SELECTOR, "ul").find_elements(By.CSS_SELECTOR, "li")
                op_list = [op.find_element(By.CSS_SELECTOR, "div:nth-child(2)").text.strip().replace('|', '\\|') for op in options]
                op_string = "|".join(op_list)
                explanation = q_div[4].get_attribute("innerHTML")
                writer.writerow([name, question_html, answer, op_string, explanation, "mc"])

driver.quit()
