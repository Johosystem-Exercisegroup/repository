import pandas as pd
from sqlalchemy import create_engine

# MySQL接続設定
user = "root"
password = "rootpassword"
host = "127.0.0.1"
port = 3307
database = "tokuteikadai"

# SQLAlchemyエンジン作成
engine_url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
engine = create_engine(engine_url)

# データベースからデータを取得
query = "SELECT subject_category, subject_name, credit, grade_year, note FROM class_data_ssi"
df = pd.read_sql(query, engine)

# CSVファイルに保存（タブ区切り、ヘッダー付き）
df.to_csv("class_data_ssi.csv", sep="\t", index=False, encoding="utf-8")

print(f"✅ CSVファイルを作成しました: class_data_ssi.csv")
print(f"📊 データ件数: {len(df)}")
print(f"📋 カラム: {df.columns.tolist()}")
print("\n最初の5行:")
print(df.head())
