# ⚙️ GearGuard – Maintenance Management System

A comprehensive **maintenance management system** for tracking equipment, work centers, maintenance requests, and team workflows.

---

## 🔋 Features

### Core Functionality
- **Equipment Management** – Track machines, tools, and equipment with health monitoring  
- **Maintenance Requests** – Corrective and preventive maintenance workflows  
- **Work Centers** – Location-based capacity and cost tracking  
- **Maintenance Teams** – Technician grouping with role-based assignments  
- **Calendar View** – Interactive scheduling for maintenance activities  
- **Kanban Board** – Drag-and-drop request status management  
- **Reporting & Analytics** – Real-time dashboards and trend analysis  
- **User Authentication** – Secure JWT-based authentication with RBAC  

---

## 📊 Dashboard Metrics
- Critical equipment health monitoring  
- Technician workload tracking  
- Open requests & overdue alerts  
- Recent maintenance requests with search  

---

## 📝 Request Management
- Priority levels: **Low, Medium, High, Urgent**  
- Status tracking: **New, In Progress, Repaired, Scrap**  
- Equipment or work center targeting  
- Team & technician assignment  
- Scheduled date planning  

---

## 🛠 Tech Stack

### Backend
- **Framework:** FastAPI (Python)  
- **Database:** PostgreSQL  
- **ORM:** SQLAlchemy  
- **Authentication:** JWT (JSON Web Tokens)  
- **Validation:** Pydantic  
- **API Docs:** Swagger / OpenAPI (auto-generated)  

### Frontend
- **Framework:** React 18 + TypeScript  
- **Routing:** React Router v6  
- **State Management:** TanStack Query + Context API  
- **Styling:** Tailwind CSS  
- **Build Tool:** Vite  
- **HTTP Client:** Axios  

---

## 📦 Installation

### Prerequisites
- Python **3.10+**  
- Node.js **18+** (npm or yarn)  
- PostgreSQL **14+**

---

## 🔧 Backend Setup

```bash
cd backend


## 📋 Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

## ⚙️ Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
copy .env.example .env

# Edit .env and update database credentials

# Initialize database (creates database + tables)
python -m app.init_db

# Optional: Create admin user
python -m app.init_db --create-admin

# Run the application
uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📚 API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
  - Body: `{ name, email, password, confirm_password }`
  - Returns: User object

- `POST /auth/login` - Authenticate user
  - Body: `{ email, password }`
  - Returns: { access_token, user }

- `GET /auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: User object

## 🔐 Default User Roles

- **User**: Can create maintenance requests
- **Technician**: Executes assigned maintenance tasks
- **Manager**: Assigns work and schedules preventive tasks
- **Admin**: Manages users, teams, and equipment

## 🏗️ Project Structure

```
gearguard/
├── backend/
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   ├── utils/          # Utilities (auth, security)
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database connection
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API clients
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main component
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🧪 Testing

### Backend

Test API endpoints using the interactive documentation at `http://localhost:8000/docs`

Or use curl:

```bash
# Signup
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Test123","confirm_password":"Test123"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test123"}'
```

### Frontend

1. Navigate to `http://localhost:5173`
2. Click "Sign up" and create a new account
3. Log in with your credentials
4. Verify role-based redirection

## 🔒 Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Password complexity validation (8+ chars, uppercase, lowercase, number)
- Email format validation
- Protected API endpoints
- Role-based access control
- CORS configuration

## 📝 Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gearguard
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```


## 📄 License

This project is built for educational and demonstration purposes.

## 👥 Contributing

This is a hackathon project. Features are being implemented incrementally.

## 📞 Support

For issues or questions, please create an issue in the repository.
