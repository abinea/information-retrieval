from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.webdriver.edge.options import Options
from configparser import ConfigParser
from bs4 import BeautifulSoup
from os import path, mkdir
import re

# 选项
options = Options()
options.add_argument("--headless")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

# 创建pages文件夹
folder = "pages"
dirname = path.dirname(__file__)
folder_path = path.join(dirname, "..", folder)
if not path.exists(folder_path):
    mkdir(folder_path)

# 获取用户的主目录以及项目位置
PATH = path.dirname(path.abspath(__file__)) + "/../"

config = ConfigParser()
# 创建config.ini提供账号密码
config.read(PATH + "python/config.ini")
account = config["user"]["account"]
password = config["user"]["password"]

# 爬取深圳大学校庆网
url = r"https://xq40.szu.edu.cn/"
browser = webdriver.Edge(options=options)
cnt = 0
for index in ["/tzgg.htm", "/xqdt/xqxw.htm"]:
    browser.get(url + index)

    # 找到当前页面的跳转按钮
    nav = browser.find_element("xpath", "/html/body/div[4]/div/div[2]/div/div/span[1]")
    nav_html = nav.get_attribute("innerHTML")
    nav_url = re.compile(r'<a href="(?P<url>.*?)">', re.S).finditer(nav_html)
    for i, nav in enumerate(nav_url):
        # 找到当前页面的所有文章table
        table = browser.find_element("xpath", "/html/body/div[4]/div/div[2]/ul")
        table_html = table.get_attribute("innerHTML")
        if index == "/tzgg.htm":
            article_url = re.compile(r'<a href="(?P<url>.*?)" class="wl">').finditer(
                table_html
            )
        elif index == "/xqdt/xqxw.htm":
            article_url = re.compile(
                r'<a href="(?P<url>.*?)" class="flex" title=".*?"'
            ).finditer(table_html)
        else:
            article_url = re.compile(
                r'<a href="(?P<url>.*?)" class="wl" title=".*?" target="_blank"'
            ).finditer(table_html)

        for j, article in enumerate(article_url):
            page_url = article.group("url")
            if re.compile(r"mp.weixin.qq.com").search(page_url):
                browser.get(page_url)
                # 找到文本主体
                try:
                    page_element = browser.find_element(
                        "xpath", "/html/body/div[1]/div[2]/div[1]/div/div[1]"
                    )
                except Exception as e:
                    print(e)
                    continue
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: " + page_url + "\n" + re.sub(r"\n+", "\n", soup.get_text())
                )
            elif re.compile(r"bio.szu.edu.cn").search(page_url):
                browser.get(page_url)
                # 找到文本主体
                page_element = browser.find_element(
                    "xpath", "/html/body/div[1]/div[2]/article/div/div[1]/div[2]/div"
                )
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: " + page_url + "\n" + re.sub(r"\n+", "\n", soup.get_text())
                )
            elif re.compile(r"ce.szu.edu.cn").search(page_url):
                browser.get(page_url)
                # 找到文本主体
                page_element = browser.find_element(
                    "xpath", "/html/body/div[7]/div/div[2]/form"
                )
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: " + page_url + "\n" + re.sub(r"\n+", "\n", soup.get_text())
                )
            elif re.compile(r"info.lib.szu.edu.cn").search(page_url):
                browser.get(page_url)
                # 找到文本主体
                page_element = browser.find_element(
                    "xpath", "/html/body/div[1]/div[2]/section[1]/main/div"
                )
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: " + page_url + "\n" + re.sub(r"\n+", "\n", soup.get_text())
                )
            elif re.compile(r"info").search(page_url):  # 校庆网的文章
                browser.get(url + page_url)
                # 找到文本主体
                page_element = browser.find_element(
                    "xpath", "/html/body/div[3]/div/div/div/div[1]/form/div"
                )
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: "
                    + url
                    + page_url
                    + "\n"
                    + re.sub(r"\n+", "\n", soup.get_text())
                )
            elif re.compile(r"www.sznews.com").search(page_url):
                browser.get(page_url)
                # 找到文本主体
                page_element = browser.find_element(
                    "xpath", "/html/body/div[4]/div[1]/div"
                )
                page_html = page_element.get_attribute("innerHTML")
                soup = BeautifulSoup(page_html, "html.parser")
                # 匹配所有中文
                content = (
                    "[url]: "
                    + url
                    + page_url
                    + "\n"
                    + re.sub(r"\n+", "\n", soup.get_text())
                )
            else:
                browser.get(page_url)
                if j == 0:
                    username = browser.find_element("id", "username")
                    username.send_keys(account)
                    passwd = browser.find_element("id", "password")
                    passwd.send_keys(password, Keys.RETURN)

                content = browser.find_element(
                    "xpath",
                    "/html/body/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr[2]/td",
                )
                content = "[url]: " + page_url + "\n" + content.text

            # 写入文件 /data/departmentName/title.txt
            file_path = path.join(PATH, "pages", f"page_{cnt}.txt")
            cnt += 1
            if path.exists(file_path):
                print(f"File {file_path} already exists, skipping...")
            else:
                with open(file_path, "w") as f:
                    f.write(content)

        id = nav.group("url")
        if index == "/tzgg.htm":
            browser.get(url + id)
        elif index == "/xqdt/xqxw.htm":
            browser.get(url + "xqdt/" + id)

# 爬深圳大学内部网
url = r"http://www1.szu.edu.cn/board/"
browser.get(url)
# 爬取所有部门
department_element = browser.find_element(
    "xpath",
    "/html/body/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr[2]/td/table/tbody/tr/td[12]/select[2]",
)
department_html = department_element.get_attribute("innerHTML")
soup = BeautifulSoup(department_html, "html.parser")
options = soup.find_all("option")
department_list = [option.get("value") for option in options]

for department in department_list:
    if department == "":
        continue
    browser.get(url + "infolist.asp?")
    # 定位并设置年份为2023年
    year = browser.find_element("name", "dayy")
    year_list = Select(year)
    year_list.select_by_visible_text("2022年")
    # 定位并设置不同的发文单位
    dpt = browser.find_element("name", "from_username")
    dpt_list = Select(dpt)
    dpt_list.select_by_value(department)
    # 搜索
    search_box = browser.find_element("name", "searchb1")
    search_box.click()
    # 导入最近40篇文章
    table = browser.find_element(
        "xpath",
        "/html/body/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr[3]/td",
    )
    table_html = table.get_attribute("innerHTML")
    article_url = re.compile(
        r'<a target="_blank" class="fontcolor3" href="(?P<url>.*?)">', re.S
    ).finditer(table_html)
    for i, article in enumerate(article_url):
        if i == 40:
            break
        id = article.group("url")
        a_url = url + id
        browser.get(a_url)
        content = browser.find_element(
            "xpath",
            "/html/body/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr[2]/td",
        )
        content = "[url]: " + a_url + "\n" + content.text

        # 写入文件 /data/departmentName/title.txt
        file_path = path.join(PATH, "pages", f"page_{cnt}.txt")
        cnt += 1
        if path.exists(file_path):
            print(f"File {file_path} already exists, skipping...")
        else:
            with open(file_path, "w") as f:
                f.write(content)

browser.quit()
