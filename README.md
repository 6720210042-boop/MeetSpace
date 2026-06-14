# MeetSpace - University Meeting Room Booking System

A modern web application for university meeting room booking management with real-time availability checking and admin dashboard.

## Project Overview

**MeetSpace** is designed to facilitate easy room booking at universities with the following key features:
- Real-time room availability status
- Easy online booking with advanced filtering
- Role-based access control (Student, Teacher, Admin)
- University account integration (Google/SSO)
- Admin panel for room management and reporting
- Automatic booking cancellation (10 minutes no-show)

## Project Structure

```
myproject/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── server.js       # Main server entry point
│   │   ├── models/         # Database models (User, Room, Booking)
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication & authorization
│   │   └── config/         # Configuration files
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
│
└── frontend/               # React.js UI
    ├── src/
    │   ├── pages/          # Page components
    │   ├── components/     # Reusable components
    │   ├── services/       # API client services
    │   ├── hooks/          # Custom React hooks
    │   ├── styles/         # CSS files
    │   ├── App.js          # Root component
    │   └── index.js        # React entry point
    ├── public/             # Static files
    ├── package.json        # Frontend dependencies
    └── .env.example        # Environment variables template
```

## Features

### For Students & Teachers
- ✅ Login with university account (Google SSO)
- ✅ Browse available rooms with real-time status
- ✅ Book rooms with customizable time slots
- ✅ Advanced filtering (building, capacity, equipment)
- ✅ View and manage your bookings
- ✅ Check-in to bookings
- ✅ Cancel bookings
- ✅ Automatic booking cancellation after 10 minutes of no-show

### For Administrators
- 📋 Create, read, update, delete rooms
- 📊 View usage statistics and reports
- 📈 Monitor room utilization
- 👥 View user activity
- 🔧 Manage room equipment and details

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT, Google OAuth
- **Validation**: Express Middleware

### Frontend
- **Library**: React.js
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: CSS3
- **State Management**: React Hooks

## API Endpoints

### Authentication
- `POST /api/auth/login` - Google login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Rooms
- `GET /api/university-rooms` - Get all rooms with filters
- `GET /api/university-rooms/:id` - Get room details
- `GET /api/university-rooms/:id/availability` - Check availability
- `POST /api/university-rooms` - Create room (Admin)
- `PUT /api/university-rooms/:id` - Update room (Admin)
- `DELETE /api/university-rooms/:id` - Delete room (Admin)

### Bookings
- `POST /api/university-bookings` - Create booking
- `GET /api/university-bookings` - Get all bookings
- `GET /api/university-bookings/my/bookings` - Get user bookings
- `GET /api/university-bookings/:id` - Get booking details
- `PUT /api/university-bookings/:id` - Update booking
- `DELETE /api/university-bookings/:id` - Cancel booking
- `POST /api/university-bookings/:id/checkin` - Check-in

### Reports (Admin only)
- `GET /api/reports/statistics` - Usage statistics
- `GET /api/reports/utilization` - Room utilization
- `GET /api/reports/activity` - User activity

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meetspace
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NODE_ENV=development
```

5. **Start the server**
```bash
npm run dev      # Development mode with nodemon
npm start        # Production mode
```

The server will run at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend folder**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

5. **Start the development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

## Database Schema

### User Model
```
{
  email: String (unique),
  name: String,
  role: String (student/teacher/admin),
  studentId: String (optional),
  department: String,
  phone: String,
  googleId: String,
  profilePicture: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Room Model
```
{
  name: String,
  building: String,
  floor: Number,
  capacity: Number,
  equipment: {
    projector: Boolean,
    whiteboard: Boolean,
    videoConferencing: Boolean,
    wifi: Boolean,
    airConditioning: Boolean,
    microphone: Boolean,
    other: [String]
  },
  status: String (available/occupied/maintenance),
  description: String,
  image: String,
  bookingPolicy: {
    maxHoursPerDay: Number,
    maxAdvanceDays: Number,
    autoReleaseMinutes: Number
  },
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```
{
  room: ObjectId (Room),
  user: ObjectId (User),
  startTime: Date,
  endTime: Date,
  purpose: String,
  status: String (pending/confirmed/in-use/completed/cancelled/no-show),
  numberOfParticipants: Number,
  notes: String,
  autoReleasedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## User Roles & Permissions

### Student
- View rooms and availability
- Create bookings
- Manage own bookings (view, cancel, check-in)
- View own booking history

### Teacher/Staff
- All student permissions
- Longer booking duration allowed
- Priority in booking

### Admin
- All teacher permissions
- CRUD operations for rooms
- View system statistics and reports
- Manage all bookings
- User activity monitoring

## Non-Functional Requirements Compliance

✅ **Security**: No unnecessary personal data exposure  
✅ **Performance**: 2-second response time target  
✅ **UX/UI**: Clean, intuitive interface with Thai language support ready  
✅ **Scalability**: Support 1000+ concurrent users  
✅ **Backup**: MongoDB backup capabilities  
✅ **Availability**: 99.9% uptime target  
✅ **Internationalization**: Ready for multi-language support  

## Development Notes

### Team Members
- นายปฐมพร บัวเนี่ยว (6720210042)
- นางสาวอชิรญาณ์ ทองแย้ม (6720210051)
- นายอับดุลฮาลีม ศรีสุข (6720210095)

### Future Enhancements
- [ ] Multi-language support (Thai, English)
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Room images and virtual tours
- [ ] QR code check-in
- [ ] Integration with university systems
- [ ] Video conferencing room support
- [ ] Recurring bookings

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env file
- Verify network access if using MongoDB Atlas

### API Connection Error
- Check if backend is running on correct port
- Verify REACT_APP_API_URL in frontend .env
- Check CORS settings in server.js

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## License

This project is created for educational purposes at the university.

---

**Last Updated**: 2026-06-12
**Status**: Prototype/Development
