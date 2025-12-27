# GearGuard - Quick Start Guide

## 🚀 Running the Application

Follow these steps to get GearGuard up and running on your local machine.

### Prerequisites Checklist
- [ ] PostgreSQL installed and running
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Git (optional, for version control)

---

## Step 1: Database Prerequisites

**Make sure PostgreSQL is installed and running**
- You just need PostgreSQL installed - the database will be created automatically!
- Note your PostgreSQL credentials (default: username=`postgres`, password=`password`)

---

## Step 2: Backend Setup

```powershell
# Navigate to backend folder
cd C:\Users\saira\OneDrive\Desktop\Odoo-Adani\gearguard\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env file with your database credentials
notepad .env
```

**Update the .env file with your PostgreSQL credentials:**
```
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/gearguard
SECRET_KEY=your-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:5173
```

**Initialize the database (creates DB + tables automatically):**
```powershell
python -m app.init_db
```

**Optional: Create an admin user for testing:**
```powershell
python -m app.init_db --create-admin
```

**Start the backend server:**
```powershell
uvicorn app.main:app --reload
```

✅ Backend should now be running at `http://localhost:8000`
✅ API docs available at `http://localhost:8000/docs`

---

## Step 3: Frontend Setup

Open a **new terminal/PowerShell window**:

```powershell
# Navigate to frontend folder
cd C:\Users\saira\OneDrive\Desktop\Odoo-Adani\gearguard\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend should now be running at `http://localhost:5173`

---

## Step 4: Test the Application

1. **Open browser** and go to `http://localhost:5173`

2. **Create an account:**
   - Click "Sign up"
   - Fill in the form:
     - Name: Your Name
     - Email: test@example.com
     - Password: Test1234 (must have uppercase, lowercase, and number)
     - Confirm Password: Test1234
   - Click "Sign Up"

3. **Log in:**
   - You'll be redirected to login page
   - Enter your email and password
   - Click "Sign In"

4. **Verify:**
   - You should be logged in and see the Dashboard
   - Your name and role should be displayed
   - Try logging out and logging back in

---

## 🎯 Success Criteria

- ✅ Backend API is accessible at port 8000
- ✅ Frontend UI is accessible at port 5173  
- ✅ You can create a new account
- ✅ You can log in with your credentials
- ✅ Dashboard displays your user information
- ✅ Logging out works correctly
- ✅ Token persists when you refresh the page

---

## 🔧 Troubleshooting

### Backend Issues

**Error: "could not connect to server"**
- Make sure PostgreSQL is running
- Check database credentials in `.env` file
- Verify database name exists

**Error: "No module named 'app'"**
- Make sure you're in the `backend` directory
- Activate the virtual environment: `venv\Scripts\activate`

**Error: "ModuleNotFoundError"**
- Reinstall dependencies: `pip install -r requirements.txt`

### Frontend Issues

**Error: "command not found: npm"**
- Install Node.js from nodejs.org

**Error: "ECONNREFUSED"**
- Make sure backend is running on port 8000
- Check API base URL in `frontend/src/services/api.ts`

**Blank page**
- Check browser console for errors (F12)
- Verify frontend is running on port 5173

---

## 📋 Quick Commands Reference

### Backend
```powershell
# Activate venv
venv\Scripts\activate

# Run server
uvicorn app.main:app --reload

# Install new package
pip install <package-name>
pip freeze > requirements.txt
```

### Frontend
```powershell
# Run dev server
npm run dev

# Install new package
npm install <package-name>

# Build for production
npm run build
```

---

## 🎉 You're All Set!

The authentication system is now fully functional. You can:
- Create user accounts
- Log in securely
- Access protected routes
- Role-based authentication

Next features to be implemented:
- Equipment Management
- Maintenance Teams
- Maintenance Requests
- Kanban Board
- Calendar View
