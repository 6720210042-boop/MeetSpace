/**
 * bookingHelpers.test.js
 * Unit Tests for validateDateRange() and canAccessBooking()
 * using Jest as the test runner.
 *
 * Run with:  npx jest bookingHelpers.test.js
 *
 * Unit Test Case Table
 * ┌────────┬───────────────────────┬──────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┬────────────────────────────┐
 * │ TC ID  │ Function              │ Input                                        │ Expected Result                                             │ Target Statement/Branch/Path│
 * ├────────┼───────────────────────┼──────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┼────────────────────────────┤
 * │ UT-01  │ validateDateRange     │ startTime="abc", endTime="xyz"               │ { error: "Invalid date format" }                            │ Path 1 (C1=TRUE)           │
 * │ UT-02  │ validateDateRange     │ start="10:00", end="09:00" (same day)        │ { error: "Start time must be before end time" }             │ Path 2 (C2=TRUE)           │
 * │ UT-03  │ validateDateRange     │ start="2026-07-14 09:00", end="2026-07-15 10:00"│ { error: "Bookings cannot cross multiple days" }        │ Path 3 (C3=TRUE)           │
 * │ UT-04  │ validateDateRange     │ start="09:15", end="10:15" (same day)        │ { error: "Bookings must use 30-minute intervals" }          │ Path 4 (C4=TRUE)           │
 * │ UT-05  │ validateDateRange     │ start="07:00", end="08:00" (same day)        │ { error: "Bookings are allowed only between 08:00 and 17:00" }│ Path 5 (C5=TRUE)        │
 * │ UT-06  │ validateDateRange     │ start="09:00", end="10:00" (same day)        │ { start: Date, end: Date }  (สำเร็จ)                       │ Path 6 (All FALSE)         │
 * │ UT-07  │ canAccessBooking      │ user=null, booking={userId:1}                │ false                                                       │ Path 1 (C1=FALSE)          │
 * │ UT-08  │ canAccessBooking      │ user={id:1,role:"student"}, booking=null     │ false                                                       │ Path 2 (C2=FALSE)          │
 * │ UT-09  │ canAccessBooking      │ user={id:99,role:"admin"}, booking={userId:1}│ true                                                        │ Path 3 (C3=TRUE)           │
 * │ UT-10  │ canAccessBooking      │ user={id:5,role:"student"}, booking={userId:5}│ true                                                       │ Path 4 (C4=TRUE)           │
 * │ UT-11  │ canAccessBooking      │ user={id:5,role:"student"}, booking={userId:9}│ false                                                      │ Path 5 (C4=FALSE)          │
 * └────────┴───────────────────────┴──────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┴────────────────────────────┘
 */

const { validateDateRange, canAccessBooking } = require("../src/utils/bookingHelpers");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: สร้าง ISO date string ที่ระบุวันและเวลา (เพื่อหลีกเลี่ยง timezone edge)
// ─────────────────────────────────────────────────────────────────────────────
function makeDateTime(dateStr, timeStr) {
  // e.g. makeDateTime("2026-07-20", "09:00") => "2026-07-20T09:00:00"
  return `${dateStr}T${timeStr}:00`;
}

const SAME_DAY   = "2026-07-20"; // วันทำการปกติ (จันทร์)
const OTHER_DAY  = "2026-07-21";

// =============================================================================
// describe: validateDateRange
// =============================================================================
describe("validateDateRange", () => {

  // UT-01 — Path 1: วันที่ format ไม่ถูกต้อง (C1 = TRUE)
  test("UT-01: ควร return error เมื่อ input ไม่ใช่วันที่ที่ถูกต้อง", () => {
    const result = validateDateRange("abc", "xyz");
    expect(result).toEqual({ error: "Invalid date format" });
  });

  // UT-02 — Path 2: start >= end (C2 = TRUE)
  test("UT-02: ควร return error เมื่อ startTime อยู่หลัง endTime", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "10:00"),
      makeDateTime(SAME_DAY, "09:00"),
    );
    expect(result).toEqual({ error: "Start time must be before end time" });
  });

  // UT-03 — Path 3: ข้ามวัน (C3 = TRUE)
  test("UT-03: ควร return error เมื่อ start และ end ต่างวันกัน", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY,  "09:00"),
      makeDateTime(OTHER_DAY, "10:00"),
    );
    expect(result).toEqual({ error: "Bookings cannot cross multiple days" });
  });

  // UT-04 — Path 4: interval ไม่ใช่ 30 นาที (C4 = TRUE)
  test("UT-04: ควร return error เมื่อนาทีไม่ใช่ 0 หรือ 30", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "09:15"),
      makeDateTime(SAME_DAY, "10:15"),
    );
    expect(result).toEqual({ error: "Bookings must use 30-minute intervals" });
  });

  // UT-05 — Path 5: นอกเวลาทำการ (C5 = TRUE)
  test("UT-05: ควร return error เมื่อเวลาอยู่นอกช่วง 08:00–17:00", () => {
    const result = validateDateRange(
      makeDateTime(SAME_DAY, "07:00"),
      makeDateTime(SAME_DAY, "08:00"),
    );
    expect(result).toEqual({ error: "Bookings are allowed only between 08:00 and 17:00" });
  });

  // UT-06 — Path 6: ทุกเงื่อนไขผ่าน (All FALSE) → return สำเร็จ
  test("UT-06: ควร return { start, end } เมื่อ input ถูกต้องทุกข้อ", () => {
    const startStr = makeDateTime(SAME_DAY, "09:00");
    const endStr   = makeDateTime(SAME_DAY, "10:00");
    const result   = validateDateRange(startStr, endStr);
    expect(result).toHaveProperty("start");
    expect(result).toHaveProperty("end");
    expect(result.error).toBeUndefined();
    expect(result.start instanceof Date).toBe(true);
    expect(result.end   instanceof Date).toBe(true);
  });

});

// =============================================================================
// describe: canAccessBooking
// =============================================================================
describe("canAccessBooking", () => {

  // UT-07 — Path 1: user เป็น null (C1 = FALSE)
  test("UT-07: ควร return false เมื่อ user เป็น null", () => {
    const result = canAccessBooking(null, { userId: 1 });
    expect(result).toBeFalsy();
  });

  // UT-08 — Path 2: booking เป็น null (C2 = FALSE)
  test("UT-08: ควร return false เมื่อ booking เป็น null", () => {
    const result = canAccessBooking({ id: 1, role: "student" }, null);
    expect(result).toBeFalsy();
  });

  // UT-09 — Path 3: user เป็น admin (C3 = TRUE) → เข้าถึงได้ทุก booking
  test("UT-09: ควร return true เมื่อ user มี role เป็น admin", () => {
    const result = canAccessBooking(
      { id: 99, role: "admin" },
      { userId: 1 },
    );
    expect(result).toBeTruthy();
  });

  // UT-10 — Path 4: ไม่ใช่ admin แต่ userId ตรงกัน (C4 = TRUE)
  test("UT-10: ควร return true เมื่อ userId ตรงกับ user.id", () => {
    const result = canAccessBooking(
      { id: 5, role: "student" },
      { userId: 5 },
    );
    expect(result).toBeTruthy();
  });

  // UT-11 — Path 5: ไม่ใช่ admin และ userId ไม่ตรง (C4 = FALSE)
  test("UT-11: ควร return false เมื่อไม่ใช่ admin และ userId ไม่ตรงกัน", () => {
    const result = canAccessBooking(
      { id: 5, role: "student" },
      { userId: 9 },
    );
    expect(result).toBeFalsy();
  });

});
