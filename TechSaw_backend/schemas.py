from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models import PulseStatus, InquiryStatus, MachineOperationType

class BlockRequest(BaseModel):
    blocker_reason: str

class MachineOut(BaseModel):
    id: str
    name: str
    hourly_rate: int
    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: str
    display_id: str
    client_name: str
    class Config:
        from_attributes = True

class FloorPulseOut(BaseModel):
    id: str
    status: PulseStatus
    blocker_reason: Optional[str]
    last_status_change_at: datetime
    machine: MachineOut
    order: OrderOut
    class Config:
        from_attributes = True

# What the website sends
class InquiryCreate(BaseModel):
    client_name: str
    phone_number: Optional[str] = None
    job_material: str
    job_dimension: str
    machine_type: MachineOperationType
    quantity: int = 1

# What the CRM/Dashboards receive
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