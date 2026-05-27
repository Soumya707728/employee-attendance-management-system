from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    role: str

    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    name:str
    email: str
    role: str
    salary: int
    image_url: str | None = None

class EmployeeResponse(BaseModel):
    id:int
    name: str
    email: str
    role: str
    salary: int
    image_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    employee_id: int
    status: str

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    role: str
    date: datetime
    status: str


class AttendanceUpdate(BaseModel):
    status: str