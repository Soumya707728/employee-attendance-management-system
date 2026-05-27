from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__= "user1"

    id = Column(Integer, primary_key=True, index= True)
    username = Column(String, unique=True, index= True)
    email=Column(String, unique=True, index = True)
    password= Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(String, default="employee")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, index=True)
    salary = Column(Integer)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, index=True)  # e.g., "Present", "Absent"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ApiLog(Base):
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True, nullable=True)
    username = Column(String, index=True, nullable=True)
    endpoint = Column(String, index=True, nullable=False)
    method = Column(String, index=True, nullable=False)
    status_code = Column(Integer, nullable=True)
    ip_address = Column(String, nullable=True)
    # user_agent = Column(String, nullable=True)
    # extra = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)