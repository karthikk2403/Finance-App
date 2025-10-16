from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ExpenseItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    category: str
    description: str
    amount: float

class Budget(BaseModel):
    category: str
    allocated: float

class ExpenseSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    month: str  # Format: YYYY-MM
    monthly_salary: float = 0.0
    budgets: List[Budget] = []
    expenses: List[ExpenseItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseSheetCreate(BaseModel):
    name: str
    month: str
    monthly_salary: float
    budgets: List[Budget] = []

class ExpenseItemCreate(BaseModel):
    date: str
    category: str
    description: str
    amount: float

class ExpenseStats(BaseModel):
    total: float
    by_category: dict
    count: int

class ComparisonData(BaseModel):
    sheet1: ExpenseSheet
    sheet2: ExpenseSheet
    comparison: dict

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

# Auth endpoints
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

# Expense Sheet endpoints
@api_router.post("/sheets", response_model=ExpenseSheet)
async def create_sheet(sheet_data: ExpenseSheetCreate, current_user: User = Depends(get_current_user)):
    sheet = ExpenseSheet(
        user_id=current_user.id,
        name=sheet_data.name,
        month=sheet_data.month
    )
    
    sheet_dict = sheet.model_dump()
    sheet_dict['created_at'] = sheet_dict['created_at'].isoformat()
    sheet_dict['updated_at'] = sheet_dict['updated_at'].isoformat()
    
    await db.expense_sheets.insert_one(sheet_dict)
    return sheet

@api_router.get("/sheets", response_model=List[ExpenseSheet])
async def get_sheets(current_user: User = Depends(get_current_user)):
    sheets = await db.expense_sheets.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for sheet in sheets:
        if isinstance(sheet['created_at'], str):
            sheet['created_at'] = datetime.fromisoformat(sheet['created_at'])
        if isinstance(sheet['updated_at'], str):
            sheet['updated_at'] = datetime.fromisoformat(sheet['updated_at'])
    
    return sheets

@api_router.get("/sheets/{sheet_id}", response_model=ExpenseSheet)
async def get_sheet(sheet_id: str, current_user: User = Depends(get_current_user)):
    sheet = await db.expense_sheets.find_one(
        {"id": sheet_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    if isinstance(sheet['created_at'], str):
        sheet['created_at'] = datetime.fromisoformat(sheet['created_at'])
    if isinstance(sheet['updated_at'], str):
        sheet['updated_at'] = datetime.fromisoformat(sheet['updated_at'])
    
    return ExpenseSheet(**sheet)

@api_router.delete("/sheets/{sheet_id}")
async def delete_sheet(sheet_id: str, current_user: User = Depends(get_current_user)):
    result = await db.expense_sheets.delete_one({"id": sheet_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sheet not found")
    return {"message": "Sheet deleted successfully"}

# Expense endpoints
@api_router.post("/sheets/{sheet_id}/expenses", response_model=ExpenseSheet)
async def add_expense(sheet_id: str, expense_data: ExpenseItemCreate, current_user: User = Depends(get_current_user)):
    sheet = await db.expense_sheets.find_one(
        {"id": sheet_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    expense = ExpenseItem(**expense_data.model_dump())
    
    await db.expense_sheets.update_one(
        {"id": sheet_id},
        {
            "$push": {"expenses": expense.model_dump()},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    updated_sheet = await db.expense_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if isinstance(updated_sheet['created_at'], str):
        updated_sheet['created_at'] = datetime.fromisoformat(updated_sheet['created_at'])
    if isinstance(updated_sheet['updated_at'], str):
        updated_sheet['updated_at'] = datetime.fromisoformat(updated_sheet['updated_at'])
    
    return ExpenseSheet(**updated_sheet)

@api_router.put("/sheets/{sheet_id}/expenses/{expense_id}", response_model=ExpenseSheet)
async def update_expense(
    sheet_id: str,
    expense_id: str,
    expense_data: ExpenseItemCreate,
    current_user: User = Depends(get_current_user)
):
    sheet = await db.expense_sheets.find_one(
        {"id": sheet_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    expenses = sheet.get('expenses', [])
    expense_index = next((i for i, e in enumerate(expenses) if e['id'] == expense_id), None)
    
    if expense_index is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    expenses[expense_index].update(expense_data.model_dump())
    
    await db.expense_sheets.update_one(
        {"id": sheet_id},
        {
            "$set": {
                "expenses": expenses,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated_sheet = await db.expense_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if isinstance(updated_sheet['created_at'], str):
        updated_sheet['created_at'] = datetime.fromisoformat(updated_sheet['created_at'])
    if isinstance(updated_sheet['updated_at'], str):
        updated_sheet['updated_at'] = datetime.fromisoformat(updated_sheet['updated_at'])
    
    return ExpenseSheet(**updated_sheet)

@api_router.delete("/sheets/{sheet_id}/expenses/{expense_id}", response_model=ExpenseSheet)
async def delete_expense(
    sheet_id: str,
    expense_id: str,
    current_user: User = Depends(get_current_user)
):
    await db.expense_sheets.update_one(
        {"id": sheet_id, "user_id": current_user.id},
        {
            "$pull": {"expenses": {"id": expense_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    updated_sheet = await db.expense_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if not updated_sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    if isinstance(updated_sheet['created_at'], str):
        updated_sheet['created_at'] = datetime.fromisoformat(updated_sheet['created_at'])
    if isinstance(updated_sheet['updated_at'], str):
        updated_sheet['updated_at'] = datetime.fromisoformat(updated_sheet['updated_at'])
    
    return ExpenseSheet(**updated_sheet)

# Statistics endpoint
@api_router.get("/sheets/{sheet_id}/stats", response_model=ExpenseStats)
async def get_stats(sheet_id: str, current_user: User = Depends(get_current_user)):
    sheet = await db.expense_sheets.find_one(
        {"id": sheet_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    expenses = sheet.get('expenses', [])
    total = sum(e['amount'] for e in expenses)
    
    by_category = {}
    for expense in expenses:
        category = expense['category']
        by_category[category] = by_category.get(category, 0) + expense['amount']
    
    return ExpenseStats(
        total=total,
        by_category=by_category,
        count=len(expenses)
    )

# Comparison endpoint
@api_router.get("/sheets/compare/{sheet1_id}/{sheet2_id}", response_model=ComparisonData)
async def compare_sheets(
    sheet1_id: str,
    sheet2_id: str,
    current_user: User = Depends(get_current_user)
):
    sheet1 = await db.expense_sheets.find_one(
        {"id": sheet1_id, "user_id": current_user.id},
        {"_id": 0}
    )
    sheet2 = await db.expense_sheets.find_one(
        {"id": sheet2_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet1 or not sheet2:
        raise HTTPException(status_code=404, detail="One or both sheets not found")
    
    # Convert datetime strings
    for sheet in [sheet1, sheet2]:
        if isinstance(sheet['created_at'], str):
            sheet['created_at'] = datetime.fromisoformat(sheet['created_at'])
        if isinstance(sheet['updated_at'], str):
            sheet['updated_at'] = datetime.fromisoformat(sheet['updated_at'])
    
    # Calculate totals
    total1 = sum(e['amount'] for e in sheet1.get('expenses', []))
    total2 = sum(e['amount'] for e in sheet2.get('expenses', []))
    
    # Calculate by category
    cat1 = {}
    for e in sheet1.get('expenses', []):
        cat1[e['category']] = cat1.get(e['category'], 0) + e['amount']
    
    cat2 = {}
    for e in sheet2.get('expenses', []):
        cat2[e['category']] = cat2.get(e['category'], 0) + e['amount']
    
    # Calculate differences
    all_categories = set(cat1.keys()) | set(cat2.keys())
    category_comparison = {}
    for cat in all_categories:
        val1 = cat1.get(cat, 0)
        val2 = cat2.get(cat, 0)
        diff = val2 - val1
        percent_change = ((val2 - val1) / val1 * 100) if val1 > 0 else (100 if val2 > 0 else 0)
        category_comparison[cat] = {
            "sheet1": val1,
            "sheet2": val2,
            "difference": diff,
            "percent_change": round(percent_change, 2)
        }
    
    total_diff = total2 - total1
    total_percent = ((total2 - total1) / total1 * 100) if total1 > 0 else (100 if total2 > 0 else 0)
    
    comparison = {
        "total": {
            "sheet1": total1,
            "sheet2": total2,
            "difference": total_diff,
            "percent_change": round(total_percent, 2)
        },
        "categories": category_comparison,
        "count": {
            "sheet1": len(sheet1.get('expenses', [])),
            "sheet2": len(sheet2.get('expenses', []))
        }
    }
    
    return ComparisonData(
        sheet1=ExpenseSheet(**sheet1),
        sheet2=ExpenseSheet(**sheet2),
        comparison=comparison
    )

# PDF Generation endpoint
@api_router.get("/sheets/{sheet_id}/pdf")
async def generate_pdf(sheet_id: str, current_user: User = Depends(get_current_user)):
    sheet = await db.expense_sheets.find_one(
        {"id": sheet_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not sheet:
        raise HTTPException(status_code=404, detail="Sheet not found")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Title
    elements.append(Paragraph(f"Expense Report: {sheet['name']}", title_style))
    elements.append(Paragraph(f"Month: {sheet['month']}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Summary
    expenses = sheet.get('expenses', [])
    total = sum(e['amount'] for e in expenses)
    
    summary_data = [
        ['Total Expenses:', f'${total:.2f}'],
        ['Number of Transactions:', str(len(expenses))],
    ]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.white)
    ]))
    
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    # Category breakdown
    elements.append(Paragraph("Breakdown by Category", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    by_category = {}
    for expense in expenses:
        category = expense['category']
        by_category[category] = by_category.get(category, 0) + expense['amount']
    
    category_data = [['Category', 'Amount', 'Percentage']]
    for cat, amount in sorted(by_category.items(), key=lambda x: x[1], reverse=True):
        percentage = (amount / total * 100) if total > 0 else 0
        category_data.append([cat, f'${amount:.2f}', f'{percentage:.1f}%'])
    
    category_table = Table(category_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
    category_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(category_table)
    elements.append(Spacer(1, 30))
    
    # Detailed transactions
    elements.append(Paragraph("Detailed Transactions", styles['Heading2']))
    elements.append(Spacer(1, 10))
    
    transaction_data = [['Date', 'Category', 'Description', 'Amount']]
    for expense in sorted(expenses, key=lambda x: x['date']):
        transaction_data.append([
            expense['date'],
            expense['category'],
            expense['description'][:30] + '...' if len(expense['description']) > 30 else expense['description'],
            f"${expense['amount']:.2f}"
        ])
    
    transaction_table = Table(transaction_data, colWidths=[1.2*inch, 1.5*inch, 2.3*inch, 1*inch])
    transaction_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(transaction_table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=expense_report_{sheet['month']}.pdf"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()