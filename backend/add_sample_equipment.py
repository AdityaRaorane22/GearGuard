"""
Add sample equipment to the database for testing
"""
from app.database import SessionLocal
from app.models import Equipment, EquipmentCategory

db = SessionLocal()

# Sample equipment data
sample_equipment = [
    {
        "name": "Hydraulic Press HP-3000",
        "serial_number": "HP-3000-2024",
        "category": EquipmentCategory.MACHINERY,
        "department": "Production",
        "company": "Adani Enterprises",
        "maintenance_team": "Team A",
        "work_center": "Production Floor 1",
        "location": "Building A - Section 2",
        "is_critical": True,
        "health_score": 25
    },
    {
        "name": "Forklift Model X200",
        "serial_number": "FLX-200-001",
        "category": EquipmentCategory.VEHICLE,
        "department": "Logistics",
        "company": "Adani Enterprises",
        "maintenance_team": "Team B",
        "work_center": "Warehouse",
        "location": "Loading Bay 3",
        "is_critical": False,
        "health_score": 85
    },
    {
        "name": "CNC Machine TB-5000",
        "serial_number": "CNC-TB5K-2023",
        "category": EquipmentCategory.MACHINERY,
        "department": "Manufacturing",
        "company": "Adani Enterprises",
        "maintenance_team": "Team A",
        "work_center": "Production Floor 2",
        "location": "Building B - Section 1",
        "is_critical": True,
        "health_score": 45
    },
    {
        "name": "Power Generator 500kW",
        "serial_number": "GEN-500-2024",
        "category": EquipmentCategory.ELECTRONIC,
        "department": "Utilities",
        "company": "Adani Enterprises",
        "maintenance_team": "Team C",
        "work_center": "Power Station",
        "location": "Generator Room",
        "is_critical": True,
        "health_score": 65
    },
    {
        "name": "Industrial Drill Set",
        "serial_number": "DRILL-PRO-001",
        "category": EquipmentCategory.TOOL,
        "department": "Maintenance",
        "company": "Adani Enterprises",
        "is_critical": False,
        "health_score": 90
    }
]

# Add equipment
for eq_data in sample_equipment:
    # Check if already exists
    existing = db.query(Equipment).filter(
        Equipment.serial_number == eq_data["serial_number"]
    ).first()
    
    if not existing:
        equipment = Equipment(**eq_data)
        db.add(equipment)
        print(f"✅ Added: {eq_data['name']}")
    else:
        print(f"⏭️  Skipped (already exists): {eq_data['name']}")

db.commit()
db.close()

print("\n🎉 Sample equipment data added successfully!")
print("\nYou can now:")
print("1. Navigate to http://localhost:5173")
print("2. Login with your credentials")
print("3. Click on 'Equipment' tab to see the equipment list")
