function validateDateRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Invalid date format" };
  }

  if (start >= end) {
    return { error: "Start time must be before end time" };
  }

  if (start.toDateString() !== end.toDateString()) {
    return { error: "Bookings cannot cross multiple days" };
  }

  if (![0, 30].includes(start.getMinutes()) || ![0, 30].includes(end.getMinutes())) {
    return { error: "Bookings must use 30-minute intervals" };
  }

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  if (startHour < 8 || endHour > 17) {
    return { error: "Bookings are allowed only between 08:00 and 17:00" };
  }

  return { start, end };
}

function canAccessBooking(user, booking) {
  return user && booking && (user.role === "admin" || Number(booking.userId) === Number(user.id));
}

module.exports = { validateDateRange, canAccessBooking };
