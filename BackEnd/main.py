from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from pathlib import Path
from uuid import uuid4
from jose import jwt
import models, schemas
from database import engine, SessionLocal
from dependencies import get_db, get_current_user
from auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM
import csv
import io

models.Base.metadata.create_all(bind=engine)


# def _ensure_employee_image_column():
#     inspector = inspect(engine)
#     if "employees" not in inspector.get_table_names():
#         return

#     existing_columns = {column["name"] for column in inspector.get_columns("employees")}
#     if "image_url" in existing_columns:
#         return

#     with engine.begin() as connection:
#         connection.execute(text("ALTER TABLE employees ADD COLUMN image_url VARCHAR"))


# _ensure_employee_image_column()

app = FastAPI()

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads" / "employees"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR.parent)), name="uploads")

# API Logging Middleware


@app.middleware("http")
async def api_log_middleware(request: Request, call_next):
    response = await call_next(request)

    try:
        auth_header = request.headers.get("authorization") or ""
        token = None
        if auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]

        username = None
        employee_id = None

        if token:
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
            except Exception:
                username = None

        if username:
            db = SessionLocal()
            try:
                user = db.query(models.User).filter(models.User.username == username).first()
                if user:
                    employee = db.query(models.Employee).filter(models.Employee.email == user.email).first()
                    if employee:
                        employee_id = employee.id

                log = models.ApiLog(
                    employee_id=employee_id,
                    username=username,
                    endpoint=str(request.url.path),
                    method=request.method,
                    status_code=getattr(response, "status_code", None),
                    ip_address=request.client.host if request.client else None,
                    # user_agent=request.headers.get("user-agent"),
                )
                db.add(log)
                db.commit()
            finally:
                db.close()

    except Exception:
        pass

    return response


def _save_employee_image(image: UploadFile | None) -> str | None:
    if not image or not image.filename:
        return None

    content_type = (image.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    extension = Path(image.filename).suffix.lower() or ".jpg"
    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    with file_path.open("wb") as buffer:
        buffer.write(image.file.read())

    return f"/uploads/employees/{filename}"


def _get_filtered_attendance_rows(
    db: Session,
    from_date: date | None,
    to_date: date | None,
    role: str | None,
    employee_id: int | None,
):
    query = (
        db.query(
            models.Attendance.id,
            models.Attendance.employee_id,
            models.Employee.name.label("employee_name"),
            models.Employee.role.label("role"),
            models.Attendance.date,
            models.Attendance.status,
        )
        .join(models.Employee, models.Employee.id == models.Attendance.employee_id)
    )

    if role and role.strip().lower() != "all":
        query = query.filter(models.Employee.role == role)

    if employee_id:
        query = query.filter(models.Attendance.employee_id == employee_id)

    if from_date:
        from_dt = datetime.combine(from_date, datetime.min.time())
        query = query.filter(models.Attendance.date >= from_dt)

    if to_date:
        # Include the complete end date by filtering up to next day (exclusive).
        to_dt_exclusive = datetime.combine(to_date + timedelta(days=1), datetime.min.time())
        query = query.filter(models.Attendance.date < to_dt_exclusive)

    return query.order_by(models.Attendance.date.desc()).all()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^http://(localhost|127\\.0\\.0\\.1|\\d{1,3}(?:\\.\\d{1,3}){3}):3000$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- USER ROUTES --------

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = models.User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.username == user.username
    ).first()

    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.username}
    )

    role = (db_user.role or "employee").strip()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "username": db_user.username,
    }


# -------- EMPLOYEE ROUTES --------

@app.get("/employees", response_model=list[schemas.EmployeeResponse])
def get_employees(
    search: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(models.Employee)

    if search:
        query = query.filter(
            models.Employee.name.ilike(f"%{search}%") |
            models.Employee.role.ilike(f"%{search}%")
        )

    return query.all()


@app.post("/employees", response_model=schemas.EmployeeResponse)
def add_employee(
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    salary: int = Form(...),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    image_url = _save_employee_image(image)

    new_employee = models.Employee(
        name=name,
        email=email,
        role=role,
        salary=salary,
        image_url=image_url,
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


@app.put("/employees/{employee_id}", response_model=schemas.EmployeeResponse)
def update_employee(
    employee_id: int,
    name: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    salary: int = Form(...),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.name = name
    employee.email = email
    employee.role = role
    employee.salary = salary

    uploaded_image_url = _save_employee_image(image)
    if uploaded_image_url:
        employee.image_url = uploaded_image_url

    db.commit()
    db.refresh(employee)

    return employee


@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully"}

# -------- Attendance ROUTES --------

@app.get("/attendance", response_model=list[schemas.AttendanceResponse])
def get_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rows = (
        db.query(
            models.Attendance.id,
            models.Attendance.employee_id,
            models.Employee.name.label("employee_name"),
            models.Employee.role.label("role"),
            models.Attendance.date,
            models.Attendance.status,
        )
        .join(models.Employee, models.Employee.id == models.Attendance.employee_id)
        .order_by(models.Attendance.date.desc())
        .all()
    )

    return [
        schemas.AttendanceResponse(
            id=row.id,
            employee_id=row.employee_id,
            employee_name=row.employee_name,
            role=row.role,
            date=row.date,
            status=row.status,
        )
        for row in rows
    ]

@app.get("/attendance/summary")
def get_attendance_summary(db: Session = Depends(get_db)):

    total_employees = db.query(models.Employee).count()

    total_present = db.query(models.Attendance)\
        .filter(models.Attendance.status == "Present").count()

    total_absent = db.query(models.Attendance)\
        .filter(models.Attendance.status == "Absent").count()

    total_leave = db.query(models.Attendance)\
        .filter(models.Attendance.status == "Leave").count()

    return {
        "total_employees": total_employees,
        "present": total_present,
        "absent": total_absent,
        "leave": total_leave
    }
     


@app.post("/attendance/{employee_id}", response_model=schemas.AttendanceResponse)
def create_attendance(
    employee_id: int,
    status: str,
    attendance_date: date | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if (current_user.role or "").strip().lower() != "hr":
        raise HTTPException(status_code=403, detail="Only HR can mark attendance")

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    selected_datetime = datetime.combine(attendance_date, datetime.min.time()) if attendance_date else datetime.utcnow()

    new_attendance = models.Attendance(
        employee_id=employee_id,
        date=selected_datetime,
        status=status
    )

    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    return schemas.AttendanceResponse(
        id=new_attendance.id,
        employee_id=employee_id,
        employee_name=employee.name,
        role=employee.role,
        date=new_attendance.date,
        status=new_attendance.status,
    )   


@app.put("/attendance/{attendance_id}", response_model=schemas.AttendanceResponse)
def update_attendance(
    attendance_id: int,
    payload: schemas.AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.role or "").strip().lower() != "hr":
        raise HTTPException(status_code=403, detail="Only HR can edit attendance")

    attendance = (
        db.query(models.Attendance)
        .filter(models.Attendance.id == attendance_id)
        .first()
    )

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    attendance.status = payload.status
    attendance.date = datetime.utcnow()
    db.commit()
    db.refresh(attendance)

    employee = (
        db.query(models.Employee)
        .filter(models.Employee.id == attendance.employee_id)
        .first()
    )

    employee_name = employee.name if employee else "Unknown"
    role = employee.role if employee else "Unknown"

    return schemas.AttendanceResponse(
        id=attendance.id,
        employee_id=attendance.employee_id,
        employee_name=employee_name,
        role=role,
        date=attendance.date,
        status=attendance.status,
    )


@app.get("/attendance/export/preview", response_model=list[schemas.AttendanceResponse])
def get_attendance_export_preview(
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    role: str | None = Query(default="All"),
    employee_id: int | None = Query(default=None, alias="employeeId"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rows = _get_filtered_attendance_rows(db, from_date, to_date, role, employee_id)

    return [
        schemas.AttendanceResponse(
            id=row.id,
            employee_id=row.employee_id,
            employee_name=row.employee_name,
            role=row.role,
            date=row.date,
            status=row.status,
        )
        for row in rows
    ]


@app.get("/attendance/export")
def export_attendance(
    format: str = Query(default="csv", pattern="^(csv|excel)$"),
    from_date: date | None = Query(default=None, alias="fromDate"),
    to_date: date | None = Query(default=None, alias="toDate"),
    role: str | None = Query(default="All"),
    employee_id: int | None = Query(default=None, alias="employeeId"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    rows = _get_filtered_attendance_rows(db, from_date, to_date, role, employee_id)

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Employee ID", "Employee Name", "Role", "Date", "Status"])

        for row in rows:
            writer.writerow([
                row.id,
                row.employee_id,
                row.employee_name,
                row.role,
                row.date.isoformat() if row.date else "",
                row.status,
            ])

        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=attendance_export.csv"},
        )

    try:
        from openpyxl import Workbook
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Excel export requires openpyxl. Install it with: pip install openpyxl",
        )

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Attendance"
    sheet.append(["ID", "Employee ID", "Employee Name", "Role", "Date", "Status"])

    for row in rows:
        sheet.append([
            row.id,
            row.employee_id,
            row.employee_name,
            row.role,
            row.date.isoformat() if row.date else "",
            row.status,
        ])

    xlsx_stream = io.BytesIO()
    workbook.save(xlsx_stream)
    xlsx_stream.seek(0)

    return StreamingResponse(
        xlsx_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_export.xlsx"},
    )

# -------- Profile ROUTES --------
@app.get("/users/me")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    employee = db.query(models.Employee).filter(
        models.Employee.email == current_user.email
    ).first()

    if employee:
        return {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "role": employee.role,
            "image_url": employee.image_url,
            "created_at": employee.created_at,
        }

    # Fallback for users that don't have an employee record yet.
    return {
        "id": current_user.id,
        "name": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "image_url": None,
        "created_at": current_user.created_at,
    }


@app.put("/users/me")
def update_my_profile(
    email: str = Form(...),
    role: str = Form(...),
    image: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email, models.User.id != current_user.id)
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    original_email = current_user.email
    employee = (
        db.query(models.Employee)
        .filter(models.Employee.email == original_email)
        .first()
    )

    if employee:
        existing_employee = (
            db.query(models.Employee)
            .filter(models.Employee.email == email, models.Employee.id != employee.id)
            .first()
        )
        if existing_employee:
            raise HTTPException(status_code=400, detail="Employee email already exists")

        employee.email = email
        employee.role = role
        new_image_url = _save_employee_image(image)
        if new_image_url:
            employee.image_url = new_image_url

    current_user.email = email
    current_user.role = role

    db.commit()
    db.refresh(current_user)
    if employee:
        db.refresh(employee)

    return {
        "id": employee.id if employee else current_user.id,
        "name": employee.name if employee else current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "image_url": employee.image_url if employee else None,
        "created_at": employee.created_at if employee else current_user.created_at,
    }
