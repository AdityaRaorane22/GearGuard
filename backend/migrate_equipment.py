"""
Migrate equipment table to add new columns
"""
from app.database import SessionLocal, engine
from sqlalchemy import text

db = SessionLocal()

# SQL to add new columns
migrations = [
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS company VARCHAR DEFAULT 'Adani Enterprises'",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_team VARCHAR",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS assigned_employee_id INTEGER",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS default_technician_id INTEGER",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS work_center VARCHAR",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location VARCHAR",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
]

print("🔄 Migrating equipment table...")

for migration in migrations:
    try:
        with engine.connect() as conn:
            conn.execute(text(migration))
            conn.commit()
        print(f"✅ {migration[:50]}...")
    except Exception as e:
        print(f"⏭️  Skipped (already exists or error): {str(e)[:50]}")

print("\n🎉 Migration complete!")
print("\nYou can now run: python add_sample_equipment.py")

db.close()
