from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
import time
import sys
import os
import pymysql
from dotenv import load_dotenv

# ローカル環境用のデータベース接続設定
load_dotenv()

dbConfig = {
    "host": "localhost",
    "port": 3307,
    "user": "appuser",
    "password": "apppassword",
    "database": "tokuteikadai",
    "charset": "utf8"
}

def create_db_connection():
    """MySQLに直接接続するユーティリティ関数"""
    connection = pymysql.connect(
        host=dbConfig["host"],
        port=dbConfig["port"],
        user=dbConfig["user"],
        password=dbConfig["password"],
        database=dbConfig["database"],
        charset=dbConfig["charset"],
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection


# 現在のデータ件数を確認
connection = create_db_connection()
with connection.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) as count FROM aoyama_kougi")
    current_count = cursor.fetchone()['count']
    print(f"現在のデータ件数: {current_count}件")
connection.close()

# 開始ページをユーザーに入力してもらう
if current_count > 0:
    print(f"\n前回の続きから開始する場合、何ページ目から開始しますか？")
    print(f"（前回中断したページ番号 + 1 を入力してください）")
    start_page_input = input("開始ページ番号（Enter=1ページ目から）: ").strip()
    if start_page_input == "":
        start_page = 1
    else:
        try:
            start_page = int(start_page_input)
        except:
            print("無効な入力です。1ページ目から開始します。")
            start_page = 1
else:
    start_page = 1

print(f"{start_page}ページ目から開始します")

# セットアップ
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # ヘッドレスモードで実行
driver = webdriver.Chrome(options=options)

# 青山学院大学のシラバス検索ページにおいて、全講義が選択された状態（キャンパスを全て指定するなど）のURLにアクセス
#新年度で新たにスクレイピングをする際は、年度のカラムを追加した方が良い
url = f"https://syllabus.aoyama.ac.jp/Kensaku.aspx?__EVENTTARGET=&__EVENTARGUMENT=&__VIEWSTATEGENERATOR=309A73F1&YR=2025&BU=BU1&KW=&KM=&KI=&CP1=on&CP4=on&GB1B_0=&GKB=&DL=ja&ctl00%24CPH1%24btnKensaku=%E6%A4%9C%E7%B4%A2%2FSearch&ST=&PG={start_page}&PC=&PI="
driver.get(url)

# データを保存するリスト                                
data = []
    
    
def scrape_page():
    # BeautifulSoupでHTMLを解析
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    base_url = "https://syllabus.aoyama.ac.jp/"

    # idがCPH1_gvw_kensakuのtableを探す
    table = soup.find('table', id='CPH1_gvw_kensaku')

    if table:
        # table内のtbodyを探す
        tbody = table.find('tbody')

        if tbody:
            # tbodyの行（tr）を順番に処理
            rows = tbody.find_all('tr')
            for row in rows:
                entry = {}
                # 各行内のすべてのtdを取得
                tds = row.find_all('td')

                # クラス名に基づいてデータを抽出
                for td in tds:
                    class_name = td.get('class', [])
                    if 'col2' in class_name:
                        entry['時限'] = td.text.strip()
                    elif 'col3' in class_name:
                        entry['科目'] = td.text.strip()
                    elif 'col4' in class_name:
                        entry['教員'] = td.text.strip()
                    elif 'col6' in class_name:
                        entry['単位'] = td.text.strip()
                    elif 'col7' in class_name:
                        entry['開講'] = td.text.strip()
                    elif 'col9' in class_name:
                        entry['学年'] = td.text.strip()
                    elif 'col10' in class_name:
                        entry['メッセージ'] = td.text.strip()
                    elif 'col8' in class_name:
                        a_tag = td.find('a')
                        if a_tag and 'href' in a_tag.attrs:
                            entry['url'] = base_url + a_tag['href']

                # エントリーが空でない場合にリストに追加
                if entry:
                    data.append(entry)
        else:
            print('tbodyが見つかりません')
    else:
        print('idがCPH1_gvw_kensakuのtableが見つかりません')


   # MySQLにデータを挿入する関数
def insert_data_to_db(data):
    connection = create_db_connection()
    try:
        with connection.cursor() as cursor:
            # テーブルが存在しない場合は作成
            create_table_query = """
            CREATE TABLE IF NOT EXISTS aoyama_kougi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                時限 VARCHAR(255),
                科目 VARCHAR(255),
                教員 VARCHAR(255),
                単位 VARCHAR(255),
                開講 VARCHAR(255),
                学年 VARCHAR(255),
                メッセージ TEXT,
                url TEXT
            );
            """
            cursor.execute(create_table_query)

            # データを挿入
            insert_query = """
            INSERT INTO aoyama_kougi (時限, 科目, 教員, 単位, 開講, 学年, メッセージ, url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            for entry in data:
                cursor.execute(insert_query, (
                    entry.get('時限'),
                    entry.get('科目'),
                    entry.get('教員'),
                    entry.get('単位'),
                    entry.get('開講'),
                    entry.get('学年'),
                    entry.get('メッセージ'),
                    entry.get('url')
                ))

        # コミットして変更を反映
        connection.commit()
    finally:
        connection.close()

# ...（driver.get(url) の行まで）...
driver.get(url)

try:
    # ★★★ この行を追加 ★★★
    # ID 'CPH1_gvw_kensaku' のテーブルが表示されるまで最大60秒待機する
    WebDriverWait(driver, 60).until(
        EC.presence_of_element_located((By.ID, "CPH1_gvw_kensaku"))
    )
    print("データテーブルの読み込みを確認しました。")

except TimeoutException:
    print("エラー: タイムアウトしました。データテーブルが見つかりません。")
    print("URLや検索条件が正しいか、Webサイトの仕様が変更されていないか確認してください。")
    driver.quit()
    exit() # テーブルが見つからなければ処理を終了

# 開始ページを処理します
print(f"{start_page}ページ目をスクレイピングしています...")
scrape_page()
print(f"{start_page}ページ目のデータをデータベースに登録しています...")
insert_data_to_db(data)
data = []  # リストを空にします

# 次のページ以降の処理を開始します
i = start_page
while True:
    try:
        # "次へ"ボタンが表示されるのを待ちます
        next_button = WebDriverWait(driver, 60).until(
            EC.element_to_be_clickable((By.ID, "CPH1_rptPagerT_lnkNext"))
        )
        driver.execute_script("arguments[0].click();", next_button)

        # ページが切り替わるのを待ちます
        WebDriverWait(driver, 60).until(EC.staleness_of(next_button))
        WebDriverWait(driver, 60).until(
            EC.presence_of_element_located((By.ID, "CPH1_gvw_kensaku"))
        )
        
        time.sleep(3)
        i += 1
        print(f"{i}ページ目をスクレイピングしています...")
        
        # 新しいページのデータを取得します
        scrape_page()

        # 取得したデータをすぐにデータベースへ登録します
        print(f"{i}ページ目のデータをデータベースに登録しています...")
        insert_data_to_db(data)

        # 次のページのためにリストを空にします
        data = []

    except TimeoutException:
        # "次へ"ボタンが見つからなければ、処理を完了します
        print("最後のページに到達しました。すべての処理が完了しました。")
        break

# ブラウザを閉じます
driver.quit()
