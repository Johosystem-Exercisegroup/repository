import os
import pandas as pd
import chardet
from sqlalchemy import create_engine
# ====== CSVファイルパス ======
csv_path = r"C:\Users\ozaki syuya\.docker\tokuteikadai\class_data_ssi.csv"
# ====== 現在の状況を表示 ======
print(":開いたフォルダ: 現在の作業ディレクトリ:", os.getcwd())
print(":フォルダ: ファイル一覧:", os.listdir(os.getcwd()))
# ====== 文字コード自動判定 ======
with open(csv_path, "rb") as f:
    result = chardet.detect(f.read())
encoding = result["encoding"]
print(f":虫眼鏡: 検出された文字コード: {encoding}")
# ====== CSV読み込み ======
try:
    df = pd.read_csv(csv_path, delimiter="\t", encoding=encoding)
    if len(df.columns) == 1:
        # タブ区切りでない場合はカンマ区切りで再読み込み
        print(":警告: タブ区切りではなくカンマ区切りの可能性があります。再読み込みします。")
        df = pd.read_csv(csv_path, encoding=encoding)
except Exception as e:
    print(":x: CSV読み込みエラー:", e)
    exit()
# ====== 読み込み確認 ======
print(":チェックマーク_緑: 読み込み成功。先頭5行:")
print(df.head())
print(":線グラフ: カラム:", df.columns.tolist())
# ====== カラム名を英語に統一 ======
df.columns = ["subject_category", "subject_name", "credit", "grade_year", "note"]
# ====== MySQL接続設定 ======
user = "root"
password = "rootpassword"   # ← docker-compose.ymlのMYSQL_ROOT_PASSWORDと一致させる
host = "127.0.0.1"           # ホスト側から接続
port = 3307                  # dockerでフォワードされたポート
database = "tokuteikadai"    # データベース名
# ====== SQLAlchemyエンジン作成 ======
engine_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
engine = create_engine(engine_url)
# ====== MySQLにインポート ======
try:
    df.to_sql("class_data_ssi", con=engine, if_exists="replace", index=False)
    print(":チェックマーク_緑: MySQLに全行インポート完了: テーブル名 = class_data_ssi")
except Exception as e:
    print(":x: MySQL書き込みエラー:", e)