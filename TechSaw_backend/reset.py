from database import SessionLocal
import models

def reset_transactions():
    db = SessionLocal()
    print("Initiating Factory Floor Reset...")
    
    try:
        # 1. Clear the active shop floor
        db.query(models.FloorPulse).delete()
        
        # 2. Delete the factory orders (Strictly excluding the 'idle' sentinel)
        db.query(models.Order).filter(models.Order.id != 'idle').delete()
        
        # 3. Delete the CRM inquiries
        db.query(models.Inquiry).delete()
        
        db.commit()
        print("✅ Reset Complete. The slate is perfectly clean.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Reset Failed: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    reset_transactions()