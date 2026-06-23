from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models import PulseStatus, InquiryStatus, MachineOperationType

class BlockRequest(BaseModel):
    blocker_reason: str

class OrderOut(BaseModel):
    id: str
    display_id: str
    client_name: str
    class Config:
        from_attributes = True

class FloorPulseOut(BaseModel):
    id: str
    status: str
    blocker_reason: Optional[str]
    last_status_change_at: datetime
    order: OrderOut
    machine_label: Optional[str] = "Floor"
    class Config:
        from_attributes = True

class InquiryCreate(BaseModel):
    client_name: str
    phone_number: Optional[str] = None
    job_material: str
    job_dimension: str
    machine_type: MachineOperationType
    quantity: int = 1

class InquiryOut(BaseModel):
    id: str
    client_name: str
    phone_number: Optional[str]
    job_material: str
    job_dimension: str
    machine_type: MachineOperationType
    quantity: int
    status: InquiryStatus
    quoted_price: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True