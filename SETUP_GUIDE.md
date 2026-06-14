# MeetSpace Installation & Setup Guide

## Quick Start (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Edit .env with your settings:
# - Set MongoDB URI
# - Set JWT_SECRET to a strong random string
# - Configure Google OAuth credentials (optional for testing)

# Start the backend server
npm run dev
```

**Backend will be available at**: `http://localhost:5000`

### 2. Frontend Setup (New Terminal)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Edit .env:
# - REACT_APP_API_URL=http://localhost:5000/api

# Start the frontend
npm start
```

**Frontend will open at**: `http://localhost:3000`

## Prerequisites

### Required
- **Node.js** v14 or higher: https://nodejs.org/
- **npm** (comes with Node.js)
- **MongoDB** (local or Atlas): https://www.mongodb.com/

### Recommended
- Git for version control
- VS Code or similar IDE

## Configuration

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meetspace
JWT_SECRET=your-secret-key-min-32-characters-long
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
NODE_ENV=development
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## Database Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB service
mongod

# MongoDB will be available at localhost:27017
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in backend .env:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meetspace?retryWrites=true&w=majority
```

## Running the Application

### Development Mode

**Terminal 1 (Backend)**:
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm start
```

### Production Build

**Backend**:
```bash
cd backend
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
# Outputs to build/ folder
```

## Testing the Application

### Test Credentials

Since Google OAuth is configured, you can:
1. Use your university email (@tsu.ac.th)
2. Or modify the login check in `authController.js` to allow any email for testing

### Sample Data

To add sample rooms to test:

```bash
# Connect to MongoDB
mongo meetspace

# Run in MongoDB shell
db.rooms.insertMany([
  {
    name: "Conference Room A",
    building: "Building A",
    floor: 2,
    capacity: 20,
    equipment: {
      projector: true,
      whiteboard: true,
      videoConferencing: true,
      wifi: true,
      airConditioning: true,
      microphone: false
    },
    status: "available"
  },
  {
    name: "Meeting Room B",
    building: "Building B",
    floor: 1,
    capacity: 10,
    equipment: {
      projector: false,
      whiteboard: true,
      videoConferencing: false,
      wifi: true,
      airConditioning: true,
      microphone: false
    },
    status: "available"
  }
])
```

## Common Issues & Solutions

### 1. Port Already in Use

```bash
# Find and kill process on port 5000
netstat -tulpn | grep 5000
kill -9 <PID>

# Or for Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### 2. MongoDB Connection Failed

- Verify MongoDB is running: `mongo --version`
- Check connection string in .env
- Ensure network access (if using Atlas)

### 3. CORS Error

```javascript
// Already configured in server.js, but if needed:
// Ensure frontend URL matches CORS settings
```

### 4. Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## API Testing

### Using Postman

1. Import endpoints from provided API documentation
2. Set Authorization header: `Bearer <JWT_TOKEN>`
3. Test endpoints:

```
GET http://localhost:5000/api/university-rooms
GET http://localhost:5000/api/health
```

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"googleId":"123","email":"test@tsu.ac.th","name":"Test User"}'

# Get rooms
curl http://localhost:5000/api/university-rooms
```

## Deployment

### Backend Deployment (Heroku Example)

```bash
cd backend

# Create Procfile
echo "web: npm start" > Procfile

# Deploy
heroku create meetspace-api
heroku config:set JWT_SECRET=your_secret
heroku config:set MONGODB_URI=your_mongodb_uri
git push heroku main
```

### Frontend Deployment (Vercel Example)

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# REACT_APP_API_URL=https://your-api-domain.com/api
```

## File Structure Explanation

```
myproject/
├── backend/
│   ├── src/server.js          # Main Express app
│   ├── src/models/            # Mongoose schemas
│   ├── src/controllers/       # Route handlers
│   ├── src/routes/            # API endpoints
│   ├── src/middleware/        # Auth & validation
│   └── package.json           # Dependencies
│
└── frontend/
    ├── src/pages/             # Page components
    ├── src/components/        # Reusable components
    ├── src/services/          # API client
    ├── src/styles/            # CSS files
    └── package.json           # Dependencies
```

## Next Steps

1. ✅ Start the application (both backend & frontend)
2. ✅ Test login functionality
3. ✅ Add sample rooms in admin panel
4. ✅ Create bookings as a student
5. ✅ View analytics in admin panel

## Support & Documentation

- Backend API: See `/api/health` endpoint
- MongoDB Docs: https://docs.mongodb.com/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/

---

**For issues or questions, contact the development team**
