"""
Migration script to add new fields to equipment and maintenance_requests tables
Run this script to update your database schema
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            print("Adding new columns to equipment table...")
            
            # Add description column
            connection.execute(text("""
                ALTER TABLE equipment 
                ADD COLUMN IF NOT EXISTS description TEXT
            """))
            print("✓ Added description column")
            
            # Add assigned_date column
            connection.execute(text("""
                ALTER TABLE equipment 
                ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP
            """))
            print("✓ Added assigned_date column")
            
            # Add scrap_date column
            connection.execute(text("""
                ALTER TABLE equipment 
                ADD COLUMN IF NOT EXISTS scrap_date TIMESTAMP
            """))
            print("✓ Added scrap_date column")
            
            print("\nAdding duration column to maintenance_requests table...")
            
            # Add duration column to maintenance_requests
            connection.execute(text("""
                ALTER TABLE maintenance_requests 
                ADD COLUMN IF NOT EXISTS duration DOUBLE PRECISION
            """))
            print("✓ Added duration column")
            
            # Commit transaction
            trans.commit()
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    migrate()
