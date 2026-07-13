const { validateDateRange, canAccessBooking } = require("../src/utils/bookingHelpers");

function makeDateTime(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00`;
}

const SAME_DAY = "2026-07-20";
const OTHER_DAY = "2026-07-21";

describe("validateDateRange", () => {

  test("UT-01: ควร return error เมื่อ input ไม่ใช่วันที่ที่ถูกต้อง", () => {
    const result = validateDateRange("abc", "xyz");
    expect(result).toEqual({ error: "Invalid date format" });
  });

  test("UT-02: ควร return error เมื่อ startTime อยู่หลัง endTime", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "10:00"),
      makeDateTime(SAME_DAY, "09:00"),
    );
    expect(result).toEqual({ error: "Start time must be before end time" });
  });

  test("UT-03: ควร return error เมื่อ start และ end ต่างวันกัน", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "09:00"),
      makeDateTime(OTHER_DAY, "10:00"),
    );
    expect(result).toEqual({ error: "Bookings cannot cross multiple days" });
  });

  test("UT-04: ควร return error เมื่อนาทีไม่ใช่ 0 หรือ 30", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "09:15"),
      makeDateTime(SAME_DAY, "10:15"),
    );
    expect(result).toEqual({ error: "Bookings must use 30-minute intervals" });
  });

  test("UT-05: ควร return error เมื่อเวลาอยู่นอกช่วง 08:00–17:00", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "07:00"),
      makeDateTime(SAME_DAY, "08:00"),
    );
    expect(result).toEqual({ error: "Bookings are allowed only between 08:00 and 17:00" });
  });

  test("UT-06: ควร return { start, end } เมื่อ input ถูกต้องทุกข้อ", () => {
    const startStr = makeDateTime(SAME_DAY, "09:00");
    const endStr = makeDateTime(SAME_DAY, "10:00");
    const result = validateDateRange(startStr, endStr);
    expect(result).toHaveProperty("start");
    expect(result).toHaveProperty("end");
    expect(result.error).toBeUndefined();
    expect(result.start instanceof Date).toBe(true);
    expect(result.end instanceof Date).toBe(true);
  });

});

describe("canAccessBooking", () => {

  test("UT-07: ควร return false เมื่อ user เป็น null", () => {
    const result = canAccessBooking(null, { userId: 1 });
    expect(result).toBeFalsy();
  });

  test("UT-08: ควร return false เมื่อ booking เป็น null", () => {
    const result = canAccessBooking({ id: 1, role: "student" }, null);
    expect(result).toBeFalsy();
  });

  test("UT-09: ควร return true เมื่อ user มี role เป็น admin", () => {
    const result = canAccessBooking(
      { id: 99, role: "admin" },
      { userId: 1 },
    );
    expect(result).toBeTruthy();
  });

  test("UT-10: ควร return true เมื่อ userId ตรงกับ user.id", () => {
    const result = canAccessBooking(
      { id: 5, role: "student" },
      { userId: 5 },
    );
    expect(result).toBeTruthy();
  });

  test("UT-11: ควร return false เมื่อไม่ใช่ admin และ userId ไม่ตรงกัน", () => {
    const result = canAccessBooking(
      { id: 5, role: "student" },
      { userId: 9 },
    );
    expect(result).toBeFalsy();
  });

});
