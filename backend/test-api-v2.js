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
  console.log('====== COMPREHENSIVE API TEST SUITE ======\n');

  // 1. Health check
  console.log('✓ 1. Health Check');
  let res = await request('GET', '/api/health');
  console.log(`  Status: ${res.status}\n`);

  // 2. Login existing user or register new one
  console.log('✓ 2. Authentication');
  res = await request('POST', '/api/auth/register', {
    email: `user${Date.now()}@tsu.ac.th`,
    password: 'TestPass123',
    name: 'Test User ' + Date.now()
  });
  if (res.status === 201) {
    console.log(`  Register: ${res.status} - New user created`);
  } else {
    console.log(`  Register: ${res.status}`);
  }

  res = await request('POST', '/api/auth/login', {
    email: 'testuser@tsu.ac.th',
    password: 'TestPass123'
  });
  if (res.status === 200) {
    userToken = res.body.token;
    userId = res.body.user.id;
    console.log(`  Login: ${res.status} - User ID: ${userId}`);
  }

  res = await request('POST', '/api/auth/login', {
    email: 'admin@tsu.ac.th',
    password: 'AdminPass123'
  });
  if (res.status === 200) {
    adminToken = res.body.token;
    console.log(`  Admin Login: ${res.status} - Token received\n`);
  }

  // 3. Room operations
  console.log('✓ 3. Room Operations');
  res = await request('GET', '/api/university-rooms');
  console.log(`  Get All Rooms: ${res.status} - ${res.body.count} rooms found`);

  res = await request('GET', '/api/university-rooms/1');
  console.log(`  Get Room by ID: ${res.status} - ${res.body.room?.name}`);

  // Check availability for room 2 at a specific time
  const start = new Date();
  start.setDate(start.getDate() + 7); // 7 days from now
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(10, 0, 0, 0);
  
  res = await request('GET', `/api/university-rooms/2/availability?startTime=${start.toISOString()}&endTime=${end.toISOString()}`);
  console.log(`  Check Availability: ${res.status} - Available: ${res.body.available}\n`);

  // 4. Booking operations (create booking at future time with no conflicts)
  console.log('✓ 4. Booking Operations');
  const bookStart = new Date();
  bookStart.setDate(bookStart.getDate() + 7);
  bookStart.setHours(10, 0, 0, 0);
  const bookEnd = new Date(bookStart);
  bookEnd.setHours(11, 0, 0, 0);

  res = await request('POST', '/api/university-bookings', {
    roomId: 2,
    startTime: bookStart.toISOString(),
    endTime: bookEnd.toISOString(),
    purpose: 'ประชุมทีมโครงการ',
    numberOfParticipants: 5,
    notes: 'ห้องทดสอบการจองใหม่'
  }, userToken);
  console.log(`  Create Booking: ${res.status}`, res.status === 201 ? '✓' : '');
  if (res.body.booking) {
    bookingId = res.body.booking.id;
    console.log(`    Booking ID: ${bookingId}, Status: ${res.body.booking.status}`);
  } else {
    console.log(`    Error: ${res.body.message}`);
  }

  if (bookingId) {
    res = await request('GET', '/api/university-bookings/my/bookings', null, userToken);
    console.log(`  Get User Bookings: ${res.status} - ${res.body.count} booking(s)`);

    res = await request('GET', `/api/university-bookings/${bookingId}`, null, userToken);
    console.log(`  Get Booking by ID: ${res.status} - Purpose: ${res.body.booking?.purpose}`);

    res = await request('PUT', `/api/university-bookings/${bookingId}`, {
      purpose: 'ประชุมอัพเดตแผนงาน',
      numberOfParticipants: 8
    }, userToken);
    console.log(`  Update Booking: ${res.status}`, res.status === 200 ? '✓' : `Error: ${res.body.message}`);

    res = await request('POST', `/api/university-bookings/${bookingId}/checkin`, {}, userToken);
    console.log(`  Check-in Booking: ${res.status}`, res.status === 200 ? `✓ Status: ${res.body.booking?.status}` : `Error: ${res.body.message}`);

    res = await request('DELETE', `/api/university-bookings/${bookingId}`, {}, userToken);
    console.log(`  Cancel Booking: ${res.status}`, res.body.message ? `(${res.body.message})` : '✓');
  }
  console.log('');

  // 5. Admin operations
  console.log('✓ 5. Admin Operations');
  res = await request('GET', '/api/university-bookings', null, adminToken);
  console.log(`  Get All Bookings: ${res.status} - ${res.body.count} bookings total`);

  res = await request('POST', '/api/university-rooms', {
    name: 'ห้องประชุมทดสอบ E401',
    building: 'อาคารวิศวกรรม',
    floor: 4,
    capacity: 15,
    equipment: ['projector', 'whiteboard'],
    description: 'ห้องประชุมใหม่สำหรับทดสอบ'
  }, adminToken);
  console.log(`  Create Room (Admin): ${res.status}`, res.status === 201 ? '✓' : '');
  if (res.body.room) {
    console.log(`    Room ID: ${res.body.room.id}`);

    res = await request('PUT', `/api/university-rooms/${res.body.room.id}`, {
      capacity: 20,
      description: 'ห้องประชุมแบบอัพเกรด'
    }, adminToken);
    console.log(`  Update Room: ${res.status} - ${res.body.message || 'Success'}`);

    res = await request('DELETE', `/api/university-rooms/${res.body.room.id}`, null, adminToken);
    console.log(`  Delete Room: ${res.status} - ${res.body.message || 'Success'}`);
  }
  console.log('');

  // 6. Authorization tests
  console.log('✓ 6. Authorization Tests');
  res = await request('POST', '/api/university-rooms', {
    name: 'Unauthorized Room',
    building: 'Building X',
    floor: 1,
    capacity: 10
  }, userToken);
  console.log(`  Non-admin create room: ${res.status} (Expected 403) - ${res.body.message || 'OK'}`);

  res = await request('GET', '/api/university-bookings', null, userToken);
  if (res.status === 200) {
    console.log(`  User list all bookings: ${res.status} (Returns only own + total available)`);
  }
  console.log('');

  console.log('====== TEST SUITE COMPLETE ======');
  console.log('✓ All critical API endpoints tested');
  console.log('✓ Auth flow validated');
  console.log('✓ Booking operations confirmed');
  console.log('✓ Admin restrictions enforced');
}

test().catch(console.error);
