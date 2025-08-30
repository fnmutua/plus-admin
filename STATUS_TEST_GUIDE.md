# Status Persistence & Live Reflection Test Guide

## 🧪 Testing User Status Functionality

### Prerequisites:
1. Start the WebSocket server: `npm run chat:server`
2. Start the Vue app: `npm run dev`
3. Open the app in **2+ browser windows/tabs** (to simulate multiple users)

---

## 📝 Test Scenarios:

### **Test 1: Status Persistence**
1. **Open Chat** in Browser Window 1
2. **Change Status** from "Online" to "Away" using the dropdown
3. **Close the chat drawer**
4. **Refresh the browser page**
5. **Open chat again**
6. ✅ **Expected**: Status should still be "Away" (persisted in localStorage)

### **Test 2: Live Status Updates**
1. **Open Chat** in Browser Window 1 and Window 2
2. **In Window 1**: Change status to "Busy"
3. **In Window 2**: Check the "Online Members" dropdown
4. ✅ **Expected**: Window 2 should show Window 1's user as "Busy" with red dot

### **Test 3: Status on Join**
1. **Browser Window 1**: Set status to "Away" and keep chat open
2. **Browser Window 2**: Open chat (simulate new user joining)
3. **In Window 2**: Check "Online Members" dropdown
4. ✅ **Expected**: Should see Window 1's user with "Away" status

### **Test 4: Multiple Status Changes**
1. **Open Chat** in 3 browser windows
2. **Window 1**: Set to "Online" (green)
3. **Window 2**: Set to "Away" (yellow)
4. **Window 3**: Set to "Busy" (red)
5. ✅ **Expected**: Each window should show all other users with correct status colors

---

## 🔍 Debug Information:

### **Console Logs to Watch:**
- `"Updating user status to: [status]"`
- `"Saved status to localStorage: [status]"`
- `"Sending status update to server: [status]"`
- `"Loaded saved status from localStorage: [status]"`
- `"Updated user [userId] status to [status]"`

### **Server Logs to Watch:**
- `"User [name] changed status to [status]"`
- `"User [name] joined the chat"` (should show correct status)

### **LocalStorage Check:**
- Open browser DevTools → Application → Local Storage
- Look for key: `chatUserStatus`
- Value should match your selected status

---

## 🐛 Troubleshooting:

### **If Status Not Persisting:**
- Check browser console for localStorage errors
- Verify `loadUserStatus()` is called on mount
- Check if localStorage key `chatUserStatus` exists

### **If Live Updates Not Working:**
- Check WebSocket connection status (should show "Connected")
- Verify server logs show status update messages
- Check if `user_status_updated` messages are received in browser console

### **If Status Not Showing for Others:**
- Verify users are in each other's "Online Members" list
- Check if server is broadcasting `users_update` messages
- Ensure status dots and text are updating in dropdown

---

## ✅ Success Criteria:

1. **Persistence**: Status survives page refresh
2. **Live Updates**: Other users see status changes immediately
3. **Visual Feedback**: Correct colors (green/yellow/red) in dropdowns
4. **Server Sync**: Server logs confirm status updates
5. **LocalStorage**: Status saved and loaded correctly

## 📊 Expected Flow:

```
User Changes Status → localStorage Save → WebSocket Send → Server Broadcast → Other Users Update UI
```

Test each step to identify where any issues might occur!
