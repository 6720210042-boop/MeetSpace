# MeetSpace - Project Requirements & Specification

## Project Overview
**System Name**: MeetSpace - University Meeting Room Booking System  
**Objective**: Provide a convenient and efficient system for booking university meeting rooms online  
**Platform**: Web Application (Frontend: React, Backend: Node.js/Express, Database: MongoDB)

## Objectives
1. ✅ **Easy Booking**: Streamlined user interface for quick room reservations
2. ✅ **Real-time Status**: Display live availability of meeting rooms
3. ✅ **Reduce Duplicates**: Prevent double-booking of rooms with automatic conflict detection

## User Groups
- **Students**: Can book rooms, view availability, manage own bookings
- **Staff/Teachers**: Enhanced permissions, longer booking durations
- **Administrators**: Full system management, reporting, room management

## Functional Requirements

### 1. Authentication
- ✅ Login via University Google Account (@tsu.ac.th)
- ✅ Role-based access control (Student, Teacher, Admin)
- ✅ Session management with JWT tokens
- ✅ User profile management

### 2. Room Availability
- ✅ Real-time room status checking
- ✅ Calendar view of bookings
- ✅ Equipment details display
- ✅ Room capacity information

### 3. Booking System
- ✅ Advanced booking for future dates (up to 30 days)
- ✅ Time slot selection
- ✅ Participant count specification
- ✅ Booking purpose documentation
- ✅ Auto-cancellation: 10 minutes after start time if no-show
- ✅ Manual cancellation option

### 4. Room Search & Filtering
- ✅ Search by room name
- ✅ Filter by building
- ✅ Filter by capacity
- ✅ Filter by equipment (projector, whiteboard, video call, WiFi, A/C, microphone)

### 5. Booking Management
- ✅ View all user bookings
- ✅ Upcoming bookings
- ✅ Past bookings history
- ✅ Edit booking details (before start time)
- ✅ Cancel bookings
- ✅ Check-in functionality

### 6. Admin Features
- ✅ **CRUD Rooms**:
  - Create new rooms with details
  - Read/view all rooms
  - Update room information
  - Delete rooms or change status
- ✅ **Room Management**: Add equipment, capacity, location details
- ✅ **Booking Management**: View and manage all bookings
- ✅ **Reports**: Usage statistics, room utilization, user activity

### 7. API Endpoints

#### Authentication
```
POST   /api/auth/login              # Google login
GET    /api/auth/me                 # Get current user
POST   /api/auth/logout             # Logout
```

#### Room Management
```
GET    /api/university-rooms        # List all rooms (with filters)
GET    /api/university-rooms/:id    # Room details
GET    /api/university-rooms/:id/availability  # Check availability
POST   /api/university-rooms        # Create room (Admin)
PUT    /api/university-rooms/:id    # Update room (Admin)
DELETE /api/university-rooms/:id    # Delete room (Admin)
```

#### Booking Management
```
POST   /api/university-bookings           # Create booking
GET    /api/university-bookings           # Get all bookings
GET    /api/university-bookings/my/bookings  # User's bookings
GET    /api/university-bookings/:id       # Booking details
PUT    /api/university-bookings/:id       # Update booking
DELETE /api/university-bookings/:id       # Cancel booking
POST   /api/university-bookings/:id/checkin  # Check-in
```

#### Reports (Admin Only)
```
GET    /api/reports/statistics      # Usage statistics
GET    /api/reports/utilization     # Room utilization
GET    /api/reports/activity        # User activity report
```

## Non-Functional Requirements

### 1. Security
- ✅ No unnecessary personal data exposure
- ✅ Encrypted password storage (JWT tokens)
- ✅ Secure API communication
- ✅ Role-based authorization
- ✅ SQL injection prevention (MongoDB)

### 2. Performance
- ✅ System response within **2 seconds** for all operations
- ✅ Optimized database queries
- ✅ Efficient caching strategies
- ✅ Lazy loading of components

### 3. User Experience
- ✅ **Easy to use**: Intuitive interface design
- ✅ **Clear navigation**: Logical menu structure
- ✅ **Responsive**: Works on desktop, tablet, mobile
- ✅ **Accessible**: WCAG compliance ready
- ✅ **Language support**: Ready for Thai/English (i18n ready)

### 4. Scalability
- ✅ Support **1000+ concurrent users**
- ✅ Horizontal scaling capability
- ✅ Database indexing for performance
- ✅ Load balancing ready

### 5. Data Management
- ✅ Regular data backup capability
- ✅ Data recovery procedures
- ✅ Audit trails for admin actions
- ✅ GDPR-compliant data handling

### 6. Availability
- ✅ System availability target: **99.9% uptime**
- ✅ Monitoring and alerting
- ✅ Disaster recovery plan
- ✅ Health check endpoints

### 7. Internationalization
- ✅ Ready for **2+ languages** (Thai, English)
- ✅ i18next implementation
- ✅ Date/time localization

## Prototype Scope

### Phase 1: Core Features
- ✅ University account login (simplified for demo)
- ✅ Role-based permissions:
  1. **Student**: Basic booking access
  2. **Teacher/Staff**: Extended booking rights
  3. **Admin**: Full system control

### Phase 2: CRUD Operations
- ✅ **Create**: Add new rooms with specifications
- ✅ **Read**: Display room lists and details
- ✅ **Update**: Modify room information
- ✅ **Delete**: Remove rooms or change status

### Phase 3: Advanced Features
- ✅ Real-time booking system
- ✅ Room filtering and search
- ✅ Booking history
- ✅ Admin reports and analytics

## Data Models

### User
```javascript
{
  email: String (unique, required),
  name: String,
  role: String (student/teacher/admin),
  studentId: String,
  department: String,
  phone: String,
  googleId: String,
  profilePicture: String,
  isActive: Boolean,
  timestamps
}
```

### Room
```javascript
{
  name: String (required),
  building: String (required),
  floor: Number (required),
  capacity: Number (required),
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
  bookingPolicy: {
    maxHoursPerDay: Number,
    maxAdvanceDays: Number,
    autoReleaseMinutes: Number (default: 10)
  },
  timestamps
}
```

### Booking
```javascript
{
  room: ObjectId (required),
  user: ObjectId (required),
  startTime: Date (required),
  endTime: Date (required),
  purpose: String (required),
  status: String (pending/confirmed/in-use/completed/cancelled/no-show),
  numberOfParticipants: Number (required),
  notes: String,
  autoReleasedAt: Date,
  timestamps
}
```

## User Stories

### Student Story
> As a student, I want to quickly find and book an available meeting room for my group project so that we have a place to work efficiently.

**Acceptance Criteria**:
- Can login with university account
- Can see real-time room availability
- Can filter by equipment and capacity
- Can book a room with one click
- Can view and cancel bookings

### Teacher Story
> As a teacher, I want to book a room for my class discussion and be able to manage multiple bookings.

**Acceptance Criteria**:
- Can login with university account
- Can book rooms for longer durations
- Can view booking history
- Can receive reminders before booking time

### Admin Story
> As an administrator, I want to manage all rooms and view system statistics to ensure smooth operations.

**Acceptance Criteria**:
- Can create, edit, delete rooms
- Can view usage statistics
- Can manage all bookings
- Can see user activity reports

## Team Information

### Development Team Members
| No. | Name | Student ID |
|-----|------|-----------|
| 1 | นายปฐมพร บัวเนี่ยว | 6720210042 |
| 2 | นางสาวอชิรญาณ์ ทองแย้ม | 6720210051 |
| 3 | นายอับดุลฮาลีม ศรีสุข | 6720210095 |

## Implementation Timeline

- **Phase 1**: Authentication & User Management (Week 1-2)
- **Phase 2**: Room Management & Booking (Week 3-4)
- **Phase 3**: Admin Panel & Reporting (Week 5)
- **Phase 4**: Testing & Deployment (Week 6)

## Success Metrics

- ✅ All functional requirements implemented
- ✅ Response time < 2 seconds
- ✅ Support 1000+ concurrent users
- ✅ 99.9% uptime
- ✅ All APIs tested and working
- ✅ Admin panel fully functional
- ✅ User-friendly interface

## Future Enhancements (Not in Prototype)

- [ ] Mobile application
- [ ] Email/SMS notifications
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Advanced analytics dashboard
- [ ] QR code check-in
- [ ] Room images and 360° tours
- [ ] Recurring bookings
- [ ] Waitlist system
- [ ] Integration with university management system
- [ ] Multi-language full support

---

**Document Version**: 1.0  
**Last Updated**: 2026-06-12  
**Status**: Approved for Development
