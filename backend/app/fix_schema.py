import sys
import os
from sqlalchemy import text, inspect

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import WorkCenter, MaintenanceRequest

def fix_schema():
    print("=" * 60)
    print("FIXING DATABASE SCHEMA")
    print("=" * 60)
    
    # First, create all tables
    print("\n1. Creating tables (if not exist)...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created/verified")
    
    # Check current schema
    print("\n2. Checking current schema...")
    inspector = inspect(engine)
    columns = inspector.get_columns('maintenance_requests')
    
    column_names = [col['name'] for col in columns]
    print(f"Current columns: {', '.join(column_names)}")
    
    has_target_type = 'target_type' in column_names
    has_work_center_id = 'work_center_id' in column_names
    
    print(f"  - target_type: {'EXISTS ✅' if has_target_type else 'MISSING ❌'}")
    print(f"  - work_center_id: {'EXISTS ✅' if has_work_center_id else 'MISSING ❌'}")
    
    # Apply fixes
    with engine.begin() as conn:  # Use begin() for automatic transaction management
        
        # Add work_center_id if missing
        if not has_work_center_id:
            print("\n3. Adding work_center_id column...")
            try:
                conn.execute(text(
                    "ALTER TABLE maintenance_requests "
                    "ADD COLUMN work_center_id INTEGER NULL "
                    "REFERENCES work_centers(id)"
                ))
                print("✅ work_center_id added successfully")
            except Exception as e:
                print(f"❌ Error adding work_center_id: {e}")
                raise
        else:
            print("\n3. work_center_id already exists, skipping...")
        
        # Add target_type if missing
        if not has_target_type:
            print("\n4. Adding target_type column...")
            try:
                # First, check if enum type exists
                result = conn.execute(text(
                    "SELECT 1 FROM pg_type WHERE typname = 'maintenancetargettype'"
                ))
                
                if not result.scalar():
                    print("  Creating enum type 'maintenancetargettype'...")
                    conn.execute(text(
                        "CREATE TYPE maintenancetargettype AS ENUM ('equipment', 'work_center')"
                    ))
                    print("  ✅ Enum type created")
                else:
                    print("  Enum type already exists")
                
                # Add the column
                print("  Adding column with enum type...")
                conn.execute(text(
                    "ALTER TABLE maintenance_requests "
                    "ADD COLUMN target_type maintenancetargettype NOT NULL DEFAULT 'equipment'"
                ))
                print("✅ target_type added successfully")
            except Exception as e:
                print(f"❌ Error adding target_type: {e}")
                raise
        else:
            print("\n4. target_type already exists, skipping...")
        
        # Make equipment_id nullable if needed
        print("\n5. Making equipment_id nullable...")
        try:
            conn.execute(text(
                "ALTER TABLE maintenance_requests "
                "ALTER COLUMN equipment_id DROP NOT NULL"
            ))
            print("✅ equipment_id is now nullable")
        except Exception as e:
            # This might fail if already nullable, which is fine
            print(f"⚠️ Note: {e}")
    
    # Verify final schema
    print("\n6. Verifying final schema...")
    inspector = inspect(engine)
    final_columns = inspector.get_columns('maintenance_requests')
    final_column_names = [col['name'] for col in final_columns]
    
    print(f"Final columns: {', '.join(final_column_names)}")
    print(f"  - target_type: {'EXISTS ✅' if 'target_type' in final_column_names else 'MISSING ❌'}")
    print(f"  - work_center_id: {'EXISTS ✅' if 'work_center_id' in final_column_names else 'MISSING ❌'}")
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        fix_schema()
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
