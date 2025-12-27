import sys
import os
from sqlalchemy import text, inspect

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def check_schema():
    print("Checking schema...")
    inspector = inspect(engine)
    columns = inspector.get_columns('maintenance_requests')
    print("Columns in 'maintenance_requests':")
    found_target_type = False
    found_work_center = False
    for col in columns:
        print(f" - {col['name']} ({col['type']})")
        if col['name'] == 'target_type':
            found_target_type = True
        if col['name'] == 'work_center_id':
            found_work_center = True
            
    if not found_target_type:
        print("\n❌ 'target_type' column is MISSING!")
    else:
        print("\n✅ 'target_type' column EXISTS.")
        
    if not found_work_center:
        print("❌ 'work_center_id' column is MISSING!")
    else:
        print("✅ 'work_center_id' column EXISTS.")

if __name__ == "__main__":
    check_schema()
