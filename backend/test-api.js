const http = require('http');

const BASE_URL = 'http://localhost:5001';
let adminToken = '';
let userToken = '';
let userId = 0;
let bookingId = 0;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    } else if (userToken) {
      options.headers['Authorization'] = `Bearer ${userToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('====== API TEST SUITE ======\n');

  // 1. Health check
  console.log('1. Health Check');
  let res = await request('GET', '/api/health');
  console.log(`Status: ${res.status}`, res.body, '\n');

  // 2. Register new user
  console.log('2. Register New User');
  res = await request('POST', '/api/auth/register', {
    email: 'testuser@tsu.ac.th',
    password: 'TestPass123',
    name: 'Test User'
  });
  console.log(`Status: ${res.status}`, res.body);
  if (res.body.userId) console.log(`New User ID: ${res.body.userId}`);
  console.log('');

  // 3. Login user
  console.log('3. Login User');
  res = await request('POST', '/api/auth/login', {
    email: 'testuser@tsu.ac.th',
    password: 'TestPass123'
  });
  console.log(`Status: ${res.status}`);
  if (res.body.token) {
    userToken = res.body.token;
    userId = res.body.user.id;
    console.log(`Token received, User ID: ${userId}`);
  }
  console.log('');

  // 4. Login admin
  console.log('4. Login Admin');
  res = await request('POST', '/api/auth/login', {
    email: 'admin@tsu.ac.th',
    password: 'AdminPass123'
  });
  console.log(`Status: ${res.status}`);
  if (res.body.token) {
    adminToken = res.body.token;
    console.log('Admin token received');
  }
  console.log('');

  // 5. Get all rooms
  console.log('5. Get All Rooms');
  res = await request('GET', '/api/university-rooms');
  console.log(`Status: ${res.status}, Count: ${res.body.count}`);
  if (res.body.rooms && res.body.rooms.length > 0) {
    console.log(`Sample room: ${res.body.rooms[0].name} (ID: ${res.body.rooms[0].id})`);
  }
  console.log('');

  // 6. Get room by ID
  console.log('6. Get Room by ID');
  res = await request('GET', '/api/university-rooms/1');
  console.log(`Status: ${res.status}`, res.body.room ? { name: res.body.room.name, capacity: res.body.room.capacity } : {});
  console.log('');

  // 7. Create booking as user
  console.log('7. Create Booking (as user)');
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 2);
  const endTime = new Date(startTime);
  endTime.setHours(endTime.getHours() + 1);
  
  res = await request('POST', '/api/university-bookings', {
    roomId: 1,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    purpose: 'ทดสอบการจอง',
    numberOfParticipants: 5,
    notes: 'ห้องทดสอบ'
  }, userToken);
  console.log(`Status: ${res.status}`);
  if (res.body.booking) {
    bookingId = res.body.booking.id;
    console.log(`Booking created, ID: ${bookingId}`);
  } else {
    console.log('Response:', res.body);
  }
  console.log('');

  // 8. Get user bookings
  console.log('8. Get User Bookings');
  res = await request('GET', '/api/university-bookings/my/bookings', null, userToken);
  console.log(`Status: ${res.status}, Count: ${res.body.count}`);
  console.log('');

  // 9. Get all bookings (admin)
  console.log('9. Get All Bookings (Admin)');
  res = await request('GET', '/api/university-bookings', null, adminToken);
  console.log(`Status: ${res.status}, Count: ${res.body.count}`);
  console.log('');

  // 10. Get booking by ID
  if (bookingId) {
    console.log('10. Get Booking by ID');
    res = await request('GET', `/api/university-bookings/${bookingId}`, null, userToken);
    console.log(`Status: ${res.status}`);
    if (res.body.booking) {
      console.log(`Purpose: ${res.body.booking.purpose}, Status: ${res.body.booking.status}`);
    }
    console.log('');

    // 11. Update booking
    console.log('11. Update Booking');
    res = await request('PUT', `/api/university-bookings/${bookingId}`, {
      purpose: 'อัปเดตห้องประชุม'
    }, userToken);
    console.log(`Status: ${res.status}`);
    if (res.body.booking) {
      console.log(`Updated Purpose: ${res.body.booking.purpose}`);
    } else {
      console.log(`Error: ${res.body.message}`);
    }
    console.log('');

    // 12. Check-in booking
    console.log('12. Check-in Booking');
    res = await request('POST', `/api/university-bookings/${bookingId}/checkin`, {}, userToken);
    console.log(`Status: ${res.status}`);
    if (res.body.booking) {
      console.log(`Status after check-in: ${res.body.booking.status}`);
    } else {
      console.log(`Message: ${res.body.message}`);
    }
    console.log('');

    // 13. Cancel booking (try to cancel already checked-in booking)
    console.log('13. Cancel Booking (Checked-in)');
    res = await request('DELETE', `/api/university-bookings/${bookingId}`, {}, userToken);
    console.log(`Status: ${res.status}`, res.body);
    console.log('');
  }

  // 14. Try unauthorized access (non-admin accessing admin endpoint)
  console.log('14. Unauthorized Test (Non-admin trying to create room)');
  res = await request('POST', '/api/university-rooms', {
    name: 'Test Room',
    building: 'Building A',
    floor: 1,
    capacity: 10
  }, userToken);
  console.log(`Status: ${res.status}, Message:`, res.body.message || res.body);
  console.log('');

  console.log('====== TEST SUITE COMPLETE ======');
}

test().catch(console.error);
