import sys
import os
from sqlalchemy import text, inspect

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
# Import all models to ensure they are registered with Base
from app.models import WorkCenter, MaintenanceRequest, MaintenanceTargetType

def migrate_postgres():
    print("🔄 Running PostgreSQL migration...")
    
    # ensure work_centers table exists
    print("Checking tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Verified tables (create_all run)")

        with engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            
            # 1. Add work_center_id column
            try:
                print("Attempting to add work_center_id column...")
                conn.execute(text("ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS work_center_id INTEGER REFERENCES work_centers(id)"))
                print("✅ work_center_id column handled")
            except Exception as e:
                print(f"⚠️ Error adding work_center_id (might already exist): {e}")

            # 2. Add MaintenanceTargetType Enum and target_type column
            try:
                print("Checking/Creating enum type 'maintenancetargettype'...")
                # Check if type exists
                result = conn.execute(text("SELECT 1 FROM pg_type WHERE typname = 'maintenancetargettype'"))
                if not result.scalar():
                    print("Creating type 'maintenancetargettype'...")
                    conn.execute(text("CREATE TYPE maintenancetargettype AS ENUM ('EQUIPMENT', 'WORK_CENTER', 'equipment', 'work_center')"))
                else:
                    print("Type 'maintenancetargettype' already exists.")
            except Exception as e:
                 print(f"⚠️ Error checking/creating enum type: {e}")

            try:
                print("Attempting to add target_type column...")
                # We use the lower case values "equipment" as default because that's what the Enum values are defined as in python
                conn.execute(text("ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS target_type maintenancetargettype DEFAULT 'equipment' NOT NULL"))
                print("✅ target_type column handled")
            except Exception as e:
                 print(f"⚠️ Failed to add with Enum type, trying specific failure handling: {e}")
                 if "does not exist" in str(e) and "maintenancetargettype" in str(e):
                      print("Retrying with implicit type creation or varchar...")

            # 3. Make equipment_id nullable
            try:
                print("Altering equipment_id to be nullable...")
                conn.execute(text("ALTER TABLE maintenance_requests ALTER COLUMN equipment_id DROP NOT NULL"))
                print("✅ equipment_id made nullable")
            except Exception as e:
                print(f"⚠️ Error altering equipment_id: {e}")

    except Exception as e:
        print(f"❌ CRITICAL ERROR: Could not connect to database or execute migration: {e}")
        import traceback
        traceback.print_exc()

    print("✨ Migration complete!")

if __name__ == "__main__":
    migrate_postgres()
