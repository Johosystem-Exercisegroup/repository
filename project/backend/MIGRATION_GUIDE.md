# データベースマイグレーションガイド

## 登録番号カラムの追加

aoyama_kougiテーブルに登録番号カラムを追加するマイグレーション手順です。

### 前提条件

- MySQLデータベースが稼働していること
- データベース接続情報が正しく設定されていること

### マイグレーション手順

#### 方法1: SQLファイルを使用

1. MySQLクライアントに接続：

```bash
# Dockerを使用している場合
docker exec -it <mysql_container_name> mysql -u appuser -p tokuteikadai

# ローカル環境の場合
mysql -h localhost -P 3307 -u appuser -p tokuteikadai
```

2. SQLファイルを実行：

```bash
# Dockerの場合（コンテナ外から）
docker exec -i <mysql_container_name> mysql -u appuser -p<password> tokuteikadai < project/backend/add_touroku_no_column.sql

# ローカル環境の場合
mysql -h localhost -P 3307 -u appuser -p<password> tokuteikadai < project/backend/add_touroku_no_column.sql
```

#### 方法2: 直接SQLコマンドを実行

MySQLクライアントに接続後、以下のコマンドを実行：

```sql
ALTER TABLE aoyama_kougi ADD COLUMN 登録番号 VARCHAR(255) AFTER id;
```

### マイグレーション確認

テーブル構造を確認して、登録番号カラムが追加されたことを確認：

```sql
DESCRIBE aoyama_kougi;
```

期待される出力：

```
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | int          | NO   | PRI | NULL    | auto_increment |
| 登録番号    | varchar(255) | YES  |     | NULL    |                |
| 時限        | varchar(255) | YES  |     | NULL    |                |
| 科目        | varchar(255) | YES  |     | NULL    |                |
| 教員        | varchar(255) | YES  |     | NULL    |                |
| 単位        | varchar(255) | YES  |     | NULL    |                |
| 開講        | varchar(255) | YES  |     | NULL    |                |
| 学年        | varchar(255) | YES  |     | NULL    |                |
| メッセージ  | text         | YES  |     | NULL    |                |
| url         | text         | YES  |     | NULL    |                |
+-------------+--------------+------+-----+---------+----------------+
```

### 既存データの更新

既存データに登録番号が含まれていない場合、再スクレイピングが必要です：

1. 既存データのバックアップ（推奨）：

```sql
CREATE TABLE aoyama_kougi_backup AS SELECT * FROM aoyama_kougi;
```

2. 既存データを削除：

```sql
TRUNCATE TABLE aoyama_kougi;
```

3. スクレイピングスクリプトを実行して新しいデータを取得：

```bash
cd project/backend
python scrape/scr_aoyama_kougi.py
```

### ロールバック

問題が発生した場合のロールバック手順：

```sql
-- カラムを削除
ALTER TABLE aoyama_kougi DROP COLUMN 登録番号;

-- バックアップから復元（バックアップを取得していた場合）
DROP TABLE aoyama_kougi;
CREATE TABLE aoyama_kougi AS SELECT * FROM aoyama_kougi_backup;
```

### 注意事項

- マイグレーション実行前に必ずデータベースのバックアップを取得してください
- 本番環境での実行前に開発環境でテストしてください
- 登録番号カラムは既存データには値が入っていないため、再スクレイピングが推奨されます
