# 🎯 Bulk Booking Feature - Testing Guide

## 📋 Tổng Quan

Đã implement hoàn chỉnh UI cho bulk booking flow cho phép user đặt lịch giữ trẻ theo tuần thay vì từng ngày một.

## ✅ Các Endpoints Được Implement

### 1. **POST /api/StudentSlot/bulk-book** ✅
**Vị trí:** `src/services/studentSlot.service.js` (line 177-181)

```javascript
bulkBookSlots: async (payload) => {
  const response = await axiosInstance.post('/StudentSlot/bulk-book', payload);
}
```

**Parameters:**
- `studentId` (required) - Student ID
- `packageSubscriptionId` (required) - Active package subscription
- `branchSlotId` (required) - Branch slot to book
- `roomId` (optional) - Room ID, auto-assign if not provided
- `startDate` (required) - Start date (YYYY-MM-DD)
- `endDate` (required) - End date (YYYY-MM-DD)
- `weekDates` (required) - Array of weekdays [0-6]
- `parentNote` (optional) - Note for all bookings (max 1000 chars)

---

### 2. **GET /api/BranchSlot/available-for-student/{studentId}** ✅
**Vị trí:** `src/services/branchSlot.service.js` (line 65-150)

**Updated Parameters:**
- ✅ `startDate` - Start of date range (YYYY-MM-DD)
- ✅ `endDate` - End of date range (YYYY-MM-DD)
- ✅ `timeframeId` - Filter by timeframe
- ✅ `slotTypeId` - Filter by slot type
- ✅ `weekDate` - Filter by weekday (0-6)
- Existing: `date`, `pageIndex`, `pageSize`

---

### 3. **POST /api/BranchSlot/bulk-create** ✅
**Already implemented** - No changes needed

---

## 🎨 UI Components Created

### **Bulk Booking Flow Components:**

| File | Chức Năng | Path |
|------|----------|------|
| `BulkStep1DateRange.jsx` | Chọn khoảng thời gian (startDate/endDate) | Step 1 |
| `BulkStep2WeekDates.jsx` | Chọn ngày trong tuần (0-6) | Step 2 |
| `BulkStep3SelectSlot.jsx` | Chọn khung giờ | Step 3 |
| `BulkStep4Confirm.jsx` | Xác nhận trước khi đặt | Step 4 |
| `BulkSchedule.jsx` | Main component điều phối flow | Entry point |

**Vị trí:** `src/pages/user/children/ChildSchedule/schedule/`

---

## 🔗 Routes

| Route | Component | Loại |
|-------|-----------|------|
| `/user/management/schedule/:childId/register` | MySchedule | Single booking |
| `/user/management/schedule/:childId/bulk-register` | BulkSchedule | **Bulk booking (NEW)** |

---

## 🧪 Testing Checklist

### **Phase 1: Component Rendering**
- [ ] Navigate to child schedule page
- [ ] Verify 2 buttons appear: "Đăng ký ca chăm sóc" + "Đăng ký theo tuần"
- [ ] Click "Đăng ký theo tuần" button
- [ ] Verify BulkSchedule page loads with Step 1

### **Phase 2: Step 1 - Date Range Selection**
- [ ] Test date picker minimum date (should be today)
- [ ] Select startDate = today + 1 day
- [ ] Select endDate = today + 15 days
- [ ] Verify day count display (14 days)
- [ ] Test validation: endDate < startDate (should error)
- [ ] Test validation: no dates selected (should error)
- [ ] Click "Next" to proceed to Step 2

### **Phase 3: Step 2 - Weekday Selection**
- [ ] Verify all 7 days displayed with colors
- [ ] Click multiple weekdays (e.g., Thứ 2, Thứ 4, Thứ 6)
- [ ] Verify selected cards highlight
- [ ] Verify count shows "Đã chọn 3 ngày: Thứ hai, Thứ tư, Thứ sáu"
- [ ] Test validation: no days selected (should error)
- [ ] Click "Next" to proceed to Step 3

### **Phase 4: Step 3 - Slot Selection**
- [ ] Verify slots loaded using date range + weekDates filters
- [ ] Slots should show only for selected weekdays
- [ ] Verify slot details: branch, timeframe, weekdays available
- [ ] Select one slot
- [ ] Verify slot card highlights
- [ ] Test validation: no slot selected (should error)
- [ ] Click "Next" to proceed to Step 4

### **Phase 5: Step 4 - Confirmation**
- [ ] Verify summary cards show correct data:
  - Date range
  - Selected weekdays
  - Slot times and branch
  - **Estimated slot count** (should be correct math)
- [ ] Test parent note field:
  - Type note
  - Verify character counter (max 1000)
  - Test truncation if exceed 1000 chars
- [ ] Verify warning message about slot creation
- [ ] Click "Confirm" button

### **Phase 6: Booking Submission**
- [ ] Verify API call: `POST /api/StudentSlot/bulk-book`
- [ ] Check request payload includes all required fields:
  - ✅ studentId
  - ✅ packageSubscriptionId (auto-loaded)
  - ✅ branchSlotId
  - ✅ startDate (YYYY-MM-DD format)
  - ✅ endDate (YYYY-MM-DD format)
  - ✅ weekDates (array of numbers)
  - ✅ parentNote
  - ✅ roomId (optional)
- [ ] Verify success notification shows slot count
- [ ] Verify post-booking "Mua thêm dịch vụ" dialog appears

### **Phase 7: Service Dialog**
- [ ] Verify ServiceSelectionDialog opens
- [ ] Test it works with multiple slotIds (bulk case)
- [ ] Verify can add services to any of the created slots
- [ ] Complete or cancel service purchase
- [ ] Verify redirect back to schedule page

### **Phase 8: Error Handling**
- [ ] Test network error during booking
- [ ] Verify error message displays
- [ ] Test validation error from backend
- [ ] Test invalid date range
- [ ] Test no active subscription error

### **Phase 9: Data Validation**
- [ ] Test date format validation (YYYY-MM-DD)
- [ ] Test weekDate array values (0-6)
- [ ] Test parentNote character limit
- [ ] Test large date range (365+ days should error)
- [ ] Test past dates rejection

### **Phase 10: Comparison with Single Booking**
- [ ] Single booking still works ("/register" route)
- [ ] Both flows can coexist
- [ ] Can switch between flows without issues

---

## 🔍 API Call Examples

### Bulk Book Request:
```javascript
POST /api/StudentSlot/bulk-book

{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "packageSubscriptionId": "660e8400-e29b-41d4-a716-446655440000",
  "branchSlotId": "770e8400-e29b-41d4-a716-446655440000",
  "roomId": "880e8400-e29b-41d4-a716-446655440000",
  "startDate": "2024-12-18",
  "endDate": "2024-12-31",
  "weekDates": [1, 3, 5],  // Monday, Wednesday, Friday
  "parentNote": "Bé cần ăn kiêng nhẹ"
}
```

### Get Available Slots with Date Range:
```javascript
GET /api/BranchSlot/available-for-student/{studentId}?
  startDate=2024-12-18&
  endDate=2024-12-31&
  weekDate=1&
  pageSize=100
```

---

## 📝 Expected Responses

### Successful Bulk Booking:
```javascript
[
  {
    "id": "aaa...",
    "studentId": "550e...",
    "branchSlotId": "770e...",
    "date": "2024-12-18T12:00:00+07:00",
    // ... other slot data
  },
  {
    "id": "bbb...",
    "studentId": "550e...",
    "branchSlotId": "770e...",
    "date": "2024-12-20T12:00:00+07:00",
    // ... other slot data
  },
  // ... more slots
]
```

---

## 🐛 Known Issues to Check

- [ ] Date timezone handling (UTC+7)
- [ ] Bulk slot creation all or nothing behavior
- [ ] Performance with large date ranges
- [ ] Concurrent booking requests

---

## 📂 Modified Files

1. ✅ `src/services/studentSlot.service.js` - Added `bulkBookSlots()`
2. ✅ `src/services/branchSlot.service.js` - Updated `getAvailableSlotsForStudent()`
3. ✅ `src/router/Router.jsx` - Added bulk schedule route
4. ✅ `src/pages/user/children/ChildSchedule/index.jsx` - Added "Đăng ký theo tuần" button
5. ✅ `src/components/Common/ServiceSelectionDialog.jsx` - Support for slotIds array
6. ✅ **NEW** - All BulkStep* components
7. ✅ **NEW** - `BulkSchedule.jsx` main component

---

## 🚀 Quick Start Test

```bash
# 1. Navigate to child's schedule
/user/management/schedule/{childId}

# 2. Click "Đăng ký theo tuần"
# This loads: /user/management/schedule/{childId}/bulk-register

# 3. Fill form:
# - Select date range (next 2 weeks)
# - Select Mon, Wed, Fri
# - Choose available slot
# - Add note
# - Confirm booking

# 4. Check Network tab for API calls:
# POST /api/StudentSlot/bulk-book
# GET /api/BranchSlot/available-for-student/{studentId}
```

---

## 💡 Notes

- All slot dates and times are handled in UTC+7 timezone
- Date range is inclusive on both ends
- Estimated slot count = days in range × selected weekdays count
- Parent note applies to ALL created slots
- Room auto-assignment happens on backend if roomId not provided

---

**Last Updated:** December 17, 2025
**Status:** Ready for Testing ✅
