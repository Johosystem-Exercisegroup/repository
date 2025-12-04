import csv
import pymysql
from dotenv import load_dotenv
import os

# 環境変数を読み込む
load_dotenv()

# データベース接続設定
dbConfig = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3307)),
    "user": os.getenv("DB_USER", "appuser"),
    "password": os.getenv("DB_PASSWORD", "apppassword"),
    "database": os.getenv("DB_NAME", "tokuteikadai"),
    "charset": "utf8mb4"
}

def create_db_connection():
    """MySQLに接続"""
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

def import_touroku_no_from_csv(csv_path):
    """CSVファイルから登録番号をインポート"""
    connection = create_db_connection()
    
    try:
        # CSVファイルを読み込む（BOM付きUTF-8にも対応）
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            updated_count = 0
            not_found_count = 0
            skipped_count = 0
            
            # ヘッダーを確認
            if reader.fieldnames:
                print(f"CSVヘッダー: {reader.fieldnames}")
            
            for row in reader:
                try:
                    touroku_no = row['登録番号'].strip()
                    kougi_name = row['講義名'].strip()
                except KeyError as e:
                    print(f"エラー: CSVに必要なカラムがありません: {e}")
                    print(f"利用可能なカラム: {list(row.keys())}")
                    break
                
                # *や+、#などの記号の場合はスキップ
                if touroku_no in ['*****', '+++++', '#####']:
                    print(f"スキップ: {kougi_name} (登録番号: {touroku_no})")
                    skipped_count += 1
                    continue
                
                with connection.cursor() as cursor:
                    # 講義名でレコードを検索
                    select_query = """
                    SELECT id, 科目, 開講 FROM aoyama_kougi 
                    WHERE 科目 LIKE %s
                    """
                    cursor.execute(select_query, (f"%{kougi_name}%",))
                    results = cursor.fetchall()
                    
                    if results:
                        # 複数見つかった場合は社会情報学部のものを優先
                        target_record = None
                        for record in results:
                            if '社会情報' in record.get('開講', ''):
                                target_record = record
                                break
                        
                        # 社会情報学部が見つからない場合は最初のレコードを使用
                        if not target_record:
                            target_record = results[0]
                        
                        # 登録番号を更新
                        update_query = """
                        UPDATE aoyama_kougi 
                        SET touroku_no = %s 
                        WHERE id = %s
                        """
                        cursor.execute(update_query, (touroku_no, target_record['id']))
                        connection.commit()
                        
                        print(f"更新: {kougi_name} -> 登録番号: {touroku_no} (ID: {target_record['id']})")
                        updated_count += 1
                    else:
                        print(f"見つかりません: {kougi_name}")
                        not_found_count += 1
            
            print(f"\n=== 処理完了 ===")
            print(f"更新: {updated_count} 件")
            print(f"見つからない: {not_found_count} 件")
            print(f"スキップ: {skipped_count} 件")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    # CSVファイルのパスを指定
    # Dockerコンテナ内で実行する場合は /app/登録番号.csv
    # ローカルで実行する場合は ../../登録番号.csv
    csv_path = "/app/登録番号.csv" if os.path.exists("/app/登録番号.csv") else "../../登録番号.csv"
    
    # 絶対パスに変換（相対パスの場合）
    if not os.path.isabs(csv_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_abs_path = os.path.join(script_dir, csv_path)
    else:
        csv_abs_path = csv_path
    
    print(f"CSVファイル: {csv_abs_path}")
    
    if not os.path.exists(csv_abs_path):
        print(f"エラー: CSVファイルが見つかりません: {csv_abs_path}")
        exit(1)
    
    print("登録番号のインポートを開始します...\n")
    import_touroku_no_from_csv(csv_abs_path)
