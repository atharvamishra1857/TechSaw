import uuid
from datetime import datetime, timedelta
from database import SessionLocal, engine
import models

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()

    print("Clearing old data...")
    db.query(models.FloorPulse).delete()
    db.query(models.Order).delete()
    db.query(models.Machine).delete()
    db.query(models.Inquiry).delete()
    db.commit()

    print("Injecting Machines...")
    machines = [
        models.Machine(id="mach-1", name="Vertical Bandsaw #1", hourly_rate=250),
        models.Machine(id="mach-2", name="Double Column #2", hourly_rate=400),
        models.Machine(id="mach-3", name="Circular Saw #1", hourly_rate=150),
        models.Machine(id="mach-4", name="CNC Lathe", hourly_rate=500),
    ]
    db.add_all(machines)
    db.commit()

    print("Injecting CRM Pipeline (Inquiries)...")
    now = datetime.utcnow()
    
    inquiries = [
        # NEW LEADS (Sales Column 1)
        models.Inquiry(client_name="Tata Motors", phone_number="9876543210", job_material="High Carbon Steel", job_dimension="400mm Blocks", machine_type=models.MachineOperationType.AUTOMATIC, quantity=2, status=models.InquiryStatus.NEW, created_at=now - timedelta(hours=2)),
        models.Inquiry(client_name="Reliance Infra", phone_number="9876543211", job_material="Aluminum Extrusion", job_dimension="150mm Pipes", machine_type=models.MachineOperationType.SEMI_AUTOMATIC, quantity=1, status=models.InquiryStatus.NEW, created_at=now - timedelta(minutes=45)),
        
        # QUOTED (Sales Column 2)
        models.Inquiry(client_name="Kalyani Forge", phone_number="9876543212", job_material="Titanium Alloy", job_dimension="250mm Rounds", machine_type=models.MachineOperationType.AUTOMATIC, quantity=1, status=models.InquiryStatus.QUOTED, quoted_price=1250000, created_at=now - timedelta(days=2)),
        
        # CONFIRMED -> READY FOR DESIGN (Sales Column 3)
        models.Inquiry(client_name="Godrej Aerospace", phone_number="9876543213", job_material="Stainless Steel 304", job_dimension="500x500 Plates", machine_type=models.MachineOperationType.SEMI_AUTOMATIC, quantity=3, status=models.InquiryStatus.CONFIRMED, quoted_price=850000, created_at=now - timedelta(days=3)),
        
        # IN DESIGN (Engineer Desk)
        models.Inquiry(client_name="L&T Heavy Eng", phone_number="9876543214", job_material="Mild Steel", job_dimension="1000mm Girders", machine_type=models.MachineOperationType.MANUAL, quantity=1, status=models.InquiryStatus.IN_DESIGN, quoted_price=450000, created_at=now - timedelta(days=4)),
        models.Inquiry(client_name="Mahindra Defense", phone_number="9876543215", job_material="Armor Plating", job_dimension="800mm Sheets", machine_type=models.MachineOperationType.AUTOMATIC, quantity=5, status=models.InquiryStatus.IN_DESIGN, quoted_price=3500000, created_at=now - timedelta(hours=12)),
        
        # IN PRODUCTION (Floor/TV)
        models.Inquiry(client_name="Bharat Forge", phone_number="9876543216", job_material="Cast Iron", job_dimension="300mm", machine_type=models.MachineOperationType.SEMI_AUTOMATIC, quantity=2, status=models.InquiryStatus.IN_PRODUCTION, quoted_price=600000, created_at=now - timedelta(days=10)),
        models.Inquiry(client_name="Jindal Steel", phone_number="9876543217", job_material="Alloy Steel", job_dimension="200mm", machine_type=models.MachineOperationType.AUTOMATIC, quantity=1, status=models.InquiryStatus.IN_PRODUCTION, quoted_price=950000, created_at=now - timedelta(days=7)),
    ]
    db.add_all(inquiries)
    db.commit()

    print("Injecting Floor Pulse (Active Production)...")
    orders = [
        models.Order(id="ord-1", display_id="#1042", client_name="Bharat Forge"),
        models.Order(id="ord-2", display_id="#1045", client_name="Jindal Steel"),
    ]
    db.add_all(orders)
    db.commit()

    pulses = [
        # A running machine
        models.FloorPulse(machine_id="mach-1", order_id="ord-1", status=models.PulseStatus.RUNNING, last_status_change_at=now - timedelta(hours=3)),
        # A stopped machine bleeding money
        models.FloorPulse(machine_id="mach-2", order_id="ord-2", status=models.PulseStatus.STOPPED, blocker_reason="Waiting: Material Shortage (Motors delayed)", last_status_change_at=now - timedelta(hours=4, minutes=15)),
        # Another running machine
        models.FloorPulse(machine_id="mach-4", order_id="ord-1", status=models.PulseStatus.RUNNING, last_status_change_at=now - timedelta(minutes=45)),
    ]
    db.add_all(pulses)
    db.commit()

    print("✅ Seed complete! Your TV, CRM, and Engineer dashboards are now fully populated.")
    db.close()

if __name__ == "__main__":
    seed_database()