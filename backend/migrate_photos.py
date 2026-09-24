import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv('../.env')
import psycopg2

DATABASE_URL = os.getenv('DATABASE_URL')
print('Connecting to Neon PostgreSQL...')
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Add file_size column if not exists
cur.execute("""
    DO $body$
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='photos' AND column_name='file_size') THEN
            ALTER TABLE photos ADD COLUMN file_size INTEGER;
        END IF;
    END
    $body$;
""")

# Add display_order column if not exists
cur.execute("""
    DO $body2$
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='photos' AND column_name='display_order') THEN
            ALTER TABLE photos ADD COLUMN display_order INTEGER;
        END IF;
    END
    $body2$;
""")

conn.commit()

# Verify columns exist
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='photos' ORDER BY ordinal_position;")
cols = [row[0] for row in cur.fetchall()]
print('Photos table columns:', cols)

cur.close()
conn.close()
print('Migration complete!')
