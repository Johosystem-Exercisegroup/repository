from selenium import webdriver
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

#このスクレイピングはscr_aoyama_kougiのスクレイピングが完了した後に実行

# WebDriverのオプションを設定
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # ヘッドレスモードで実行
driver = webdriver.Chrome(options=options)

# 詳細ページからデータをスクレイピングする関数
def scrape_detail_page():
    connection = create_db_connection()
    try:
        with connection.cursor() as cursor:
            # テーブル作成を呼び出し
            create_table_if_not_exists(cursor)

            # データベースからURLを取得（既に処理済みのものは除外）
            cursor.execute("""
                SELECT a.id, a.url 
                FROM aoyama_kougi a 
                LEFT JOIN aoyama_kougi_detail d ON a.id = d.aoyama_kougi_id
                WHERE a.url IS NOT NULL AND d.aoyama_kougi_id IS NULL
            """)
            urls = cursor.fetchall()
            total = len(urls)
            print(f"処理対象: {total}件")
            
            success_count = 0
            error_count = 0
            
            for idx, url_entry in enumerate(urls, 1):
                aoyama_kougi_id = url_entry['id']
                url = url_entry['url']
                
                try:
                    driver.get(url)

                    # ページが読み込まれるのを待つ
                    try:
                        WebDriverWait(driver, 60).until(
                            EC.presence_of_element_located((By.TAG_NAME, 'body'))
                        )
                    except TimeoutException:
                        print(f"タイムアウト: URL読み込み失敗: {url}")
                        error_count += 1
                        continue

                    # スクレイピング開始
                    soup = BeautifulSoup(driver.page_source, 'html.parser')
                    all_text = soup.get_text(separator=' ', strip=True)

                    # 1件ずつ即座にデータベースに保存
                    insert_query = """
                    INSERT INTO aoyama_kougi_detail (aoyama_kougi_id, url, text)
                    VALUES (%s, %s, %s)
                    """
                    cursor.execute(insert_query, (aoyama_kougi_id, url, all_text))
                    connection.commit()
                    success_count += 1
                    
                    time.sleep(1)
                    print(f"進捗: {idx}/{total} (ID: {aoyama_kougi_id})")
                    
                except Exception as e:
                    error_count += 1
                    print(f"エラー (ID: {aoyama_kougi_id}): {str(e)[:100]}")
                    continue

            print(f"\n処理完了: 成功 {success_count}件, エラー {error_count}件")

    finally:
        connection.close()


def create_table_if_not_exists(cursor):
    """ テーブルを作成する関数 """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS aoyama_kougi_detail (
        aoyama_kougi_id INT PRIMARY KEY,  
        url TEXT,
        text TEXT
    );
    """
    cursor.execute(create_table_query)
    
    # 外部キー制約を追加
    try:
        alter_table_query = """
        ALTER TABLE aoyama_kougi_detail 
        ADD CONSTRAINT fk_aoyama_kougi
        FOREIGN KEY (aoyama_kougi_id) REFERENCES aoyama_kougi(id)
        ON DELETE CASCADE
        """
        cursor.execute(alter_table_query)
    except Exception as e:
        # 外部キー制約がすでに存在する場合は何もしない
        print(f"外部キー制約の追加中にエラーが発生しました: {e}")




# スクレイピングを実行
scrape_detail_page()

# 終了
driver.quit()
print("すべての処理が完了しました。")
