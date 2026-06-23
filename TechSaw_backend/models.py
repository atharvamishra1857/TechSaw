import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base

class InquiryStatus(str, enum.Enum):
    NEW = "NEW"
    QUOTED = "QUOTED"
    CONFIRMED = "CONFIRMED"
    IN_DESIGN = "IN_DESIGN"
    IN_PRODUCTION = "IN_PRODUCTION"
    DISPATCHED = "DISPATCHED"
    LOST = "LOST"

class MachineOperationType(str, enum.Enum):
    AUTOMATIC = "AUTOMATIC"
    SEMI_AUTOMATIC = "SEMI_AUTOMATIC"
    MANUAL = "MANUAL"

class PulseStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"

class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    display_id = Column(String, index=True, nullable=False)
    client_name = Column(String, nullable=False)
    pulses = relationship("FloorPulse", back_populates="order")

class FloorPulse(Base):
    __tablename__ = "floor_pulse"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    machine_id = Column(String, nullable=True)   # no FK, no machines table needed
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(PulseStatus), default=PulseStatus.RUNNING, nullable=False)
    blocker_reason = Column(String, nullable=True)
    last_status_change_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    order = relationship("Order", back_populates="pulses")

class Inquiry(Base):
    __tablename__ = "inquiries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    job_material = Column(String, nullable=False)
    job_dimension = Column(String, nullable=False)
    machine_type = Column(Enum(MachineOperationType), nullable=False)
    quantity = Column(Integer, default=1)
    status = Column(Enum(InquiryStatus), default=InquiryStatus.NEW, nullable=False)
    quoted_price = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)