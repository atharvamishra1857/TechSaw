from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
from database import engine, get_db

# This creates the tables in Postgres if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ACS Live Floor Pulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change "*" to your specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/pulse/live", response_model=list[schemas.FloorPulseOut])
def get_live_pulse(db: Session = Depends(get_db)):
    """
    Fetches the current state of the shop floor for the React Dashboard.
    """
    pulses = db.query(models.FloorPulse).all()
    return pulses

@app.post("/api/pulse/{pulse_id}/block", response_model=schemas.FloorPulseOut)
def block_machine(pulse_id: str, request: schemas.BlockRequest, db: Session = Depends(get_db)):
    """
    Supervisor hits this when a machine stops.
    """
    pulse = db.query(models.FloorPulse).filter(models.FloorPulse.id == pulse_id).first()
    
    if not pulse:
        raise HTTPException(status_code=404, detail="Pulse record not found")
        
    pulse.status = models.PulseStatus.STOPPED
    pulse.blocker_reason = request.blocker_reason
    pulse.last_status_change_at = datetime.utcnow()
    
    db.commit()
    db.refresh(pulse)
    
    # TODO: Trigger WhatsApp Webhook to Owner here
    
    return pulse

@app.post("/api/pulse/{pulse_id}/resume", response_model=schemas.FloorPulseOut)
def resume_machine(pulse_id: str, db: Session = Depends(get_db)):
    """
    Supervisor hits this when the blocker is resolved and the machine starts.
    """
    pulse = db.query(models.FloorPulse).filter(models.FloorPulse.id == pulse_id).first()
    
    if not pulse:
        raise HTTPException(status_code=404, detail="Pulse record not found")
        
    pulse.status = models.PulseStatus.RUNNING
    pulse.blocker_reason = None
    pulse.last_status_change_at = datetime.utcnow()
    
    db.commit()
    db.refresh(pulse)
    return pulse

# --- CRM / INQUIRY ENDPOINTS ---

@app.post("/api/inquiries", response_model=schemas.InquiryOut)
def create_new_inquiry(inquiry: schemas.InquiryCreate, db: Session = Depends(get_db)):
    new_inquiry = models.Inquiry(
        client_name=inquiry.client_name,
        phone_number=inquiry.phone_number,
        job_material=inquiry.job_material,
        job_dimension=inquiry.job_dimension,
        machine_type=inquiry.machine_type,
        quantity=inquiry.quantity,
        status=models.InquiryStatus.NEW
    )
    
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    return new_inquiry

@app.get("/api/inquiries", response_model=list[schemas.InquiryOut])
def get_all_inquiries(db: Session = Depends(get_db)):
    """
    The internal Randar/ACS CRM Dashboard hits this to load the Kanban board.
    """
    # Fetch all inquiries, sorted by newest first
    inquiries = db.query(models.Inquiry).order_by(models.Inquiry.created_at.desc()).all()
    return inquiries


@app.post("/api/inquiries/{inquiry_id}/release", response_model=schemas.InquiryOut)
def release_design_to_floor(inquiry_id: str, db: Session = Depends(get_db)):
    """
    The Design Engineer hits this when they physically hand the drawing to the floor.
    """
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    # Flip the state to trigger the Shop Floor visibility
    inquiry.status = models.InquiryStatus.IN_PRODUCTION
    
    db.commit()
    db.refresh(inquiry)
    
    return inquiry


@app.post("/api/inquiries/{inquiry_id}/push_to_design", response_model=schemas.InquiryOut)
def push_to_design(inquiry_id: str, db: Session = Depends(get_db)):
    """
    The Owner hits this to move a Confirmed Order to the Engineer's desk.
    """
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    # Flip the state to IN_DESIGN
    inquiry.status = models.InquiryStatus.IN_DESIGN
    
    db.commit()
    db.refresh(inquiry)
    
    return inquiry

# --- FLOOR ASSIGNMENT ENDPOINTS ---

@app.get("/api/floor/drawings", response_model=list[schemas.InquiryOut])
def get_floor_drawings(db: Session = Depends(get_db)):
    """
    Fetches the 'Stack of Papers' - jobs the Engineer has handed over but might not be on a machine yet.
    """
    return db.query(models.Inquiry).filter(models.Inquiry.status == models.InquiryStatus.IN_PRODUCTION).all()

@app.post("/api/pulse/{pulse_id}/assign/{inquiry_id}", response_model=schemas.FloorPulseOut)
def assign_drawing_to_machine(pulse_id: str, inquiry_id: str, db: Session = Depends(get_db)):
    """
    Supervisor hits this to load a new drawing onto a machine.
    """
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    pulse = db.query(models.FloorPulse).filter(models.FloorPulse.id == pulse_id).first()
    
    if not inquiry or not pulse:
        raise HTTPException(status_code=404, detail="Record not found")

    # 1. We create an Order record to translate the CRM Inquiry into a Factory Floor Job
    new_order_id = f"ord-{inquiry.id[:8]}"
    
    existing_order = db.query(models.Order).filter(models.Order.id == new_order_id).first()
    if not existing_order:
        new_order = models.Order(
            id=new_order_id, 
            display_id=f"#{inquiry.id[:4].upper()}", 
            client_name=inquiry.client_name
        )
        db.add(new_order)
        db.commit() # Commit early so the foreign key doesn't fail

    # 2. Overwrite the Machine's pulse with the new job and start the clock
    pulse.order_id = new_order_id
    pulse.status = models.PulseStatus.RUNNING
    pulse.blocker_reason = None
    pulse.last_status_change_at = datetime.utcnow()
    
    db.commit()
    db.refresh(pulse)
    return pulse


@app.post("/api/inquiries/{inquiry_id}/quote", response_model=schemas.InquiryOut)
def draft_quote(inquiry_id: str, price: int, db: Session = Depends(get_db)):
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    inquiry.quoted_price = price
    inquiry.status = models.InquiryStatus.QUOTED
    db.commit()
    db.refresh(inquiry)
    return inquiry


@app.post("/api/inquiries/{inquiry_id}/confirm", response_model=schemas.InquiryOut)
def confirm_quote(inquiry_id: str, db: Session = Depends(get_db)):
    """
    The Owner hits this when the client agrees to the quoted price.
    Moves the job to CONFIRMED so it can be sent to Design.
    """
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
        
    inquiry.status = models.InquiryStatus.CONFIRMED
    db.commit()
    db.refresh(inquiry)
    return inquiry

@app.post("/api/pulse/{pulse_id}/complete/{order_id}") # <-- Removed the response_model restriction
def complete_floor_job(pulse_id: str, order_id: str, db: Session = Depends(get_db)):
    """
    Supervisor hits this when the physical machine work is done.
    """
    pulse = db.query(models.FloorPulse).filter(models.FloorPulse.id == pulse_id).first()
    
    if not pulse:
        raise HTTPException(status_code=404, detail="Machine pulse not found")

    # 1. Extract the original Inquiry ID prefix
    inq_prefix = order_id.replace("ord-", "")
    
    # 2. Find the original inquiry and mark it DISPATCHED
    inquiry = db.query(models.Inquiry).filter(models.Inquiry.id.startswith(inq_prefix)).first()
    if inquiry:
        inquiry.status = models.InquiryStatus.DISPATCHED
        
    # 3. Delete the active pulse. This removes the active job from the machine,
    # making the machine available for the "Load New" button again.
    db.delete(pulse)
    db.commit()
    
    return {"status": "success", "message": "Job complete and archived."}