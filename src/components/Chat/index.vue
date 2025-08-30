<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { ElButton, ElInput, ElMessage, ElDrawer, ElBadge, ElAvatar, ElSelect, ElOption } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { getChatUsersWithPhotos } from '@/api/chat'

const appStore = useAppStore()
const { wsCache } = useCache()

// Define emits
const emit = defineEmits<{
  updateUnreadCount: [count: number]
}>()

// Chat state
const visible = ref(false)
const currentMessage = ref('')
const chatMessages = ref<any[]>([])
const onlineUsers = ref<any[]>([])
const isConnected = ref(false)
const chatContainer = ref<HTMLElement>()
const unreadCount = ref(0)
const selectedMember = ref('')
const userStatus = ref('online')
const drawerFocused = ref(false)
const lastViewedTime = ref<Date | null>(null)
const showUsersSidebar = ref(false)
const activeConversation = ref<string>('general') // 'general' or user ID
const conversations = ref<any[]>([])
const sidebarWidth = ref('250px')

// Online count tracking
const onlineCount = ref(0)

// WebSocket connection
let ws: WebSocket | null = null

// Current user info
const currentUser = computed(() => {
  const userInfo = wsCache.get(appStore.getUserInfo)
  return {
    id: userInfo?.id || 'anonymous',
    name: userInfo?.name || 'Anonymous User',
    email: userInfo?.email || '',
    avatar: userInfo?.photo || '',
    status: 'online'
  }
})

// User photo from API (like profile module)
const userPhoto = ref<string>('')
const getUserPhoto = async () => {
  try {
    const userInfo = wsCache.get(appStore.getUserInfo)
    if (userInfo?.id) {
      // Call the same API as profile module - just need id
      const { getMyProfile } = await import('@/api/users')
      const res = await getMyProfile({ id: userInfo.id } as any)
      if (res?.data?.photo) {
        userPhoto.value = res.data.photo
      }
    }
  } catch (error) {
    console.error('Error getting user photo:', error)
  }
}

// WebSocket connection
const connectWebSocket = () => {
  try {
    // Use your WebSocket server URL - adjust as needed
    const wsUrl = `ws://localhost:3001/chat`
    console.log('Attempting to connect to WebSocket:', wsUrl)
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('Chat WebSocket connected')
      isConnected.value = true
      
      // Send join message with current status
      ws?.send(JSON.stringify({
        type: 'join',
        user: {
          ...currentUser.value,
          photo: convertPhotoToDataUrl(userPhoto.value || currentUser.value.avatar), // Use API photo if available
          status: userStatus.value
        }
      }))
      
      // Also send current drawer state
      ws?.send(JSON.stringify({
        type: 'drawer_state',
        isOpen: visible.value
      }))
      
      // Update badge count after connecting
      setTimeout(() => {
        updateBadgeCount()
      }, 1000) // Small delay to allow messages to load
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    ws.onclose = () => {
      console.log('Chat WebSocket disconnected')
      isConnected.value = false
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error)
    isConnected.value = false
    // For demo purposes, simulate some online users
    //simulateOnlineUsers()
  }
}

// Handle incoming WebSocket messages
const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'message':
      if (data.message) {
        const message = {
          id: data.message.id || Date.now(),
          ...data.message,
          sender: {
            ...data.message.sender,
            photo: convertPhotoToDataUrl(data.message.sender?.photo) // Convert sender photo to base64
          },
          timestamp: new Date(data.message.timestamp || data.message.createdAt || data.message.created_at || Date.now()),
          status: data.message.status || 'received', // Default to 'received' for all messages
          message_type: data.message.message_type || (data.message.receiver_id ? 'direct_message' : 'team_chat')
        }
        
        console.log(`Received message with ID: ${message.id}, content: "${message.content}", sender: ${message.sender.name}`)
        console.log(`Message type: ${message.message_type}, receiver_id: ${message.receiver_id}, status: ${message.status}`)
        
        // Check if message already exists (avoid duplicates)
        // For messages we sent, the server might have generated a new ID
        // First, try to find by exact ID match
        let existingMessageIndex = chatMessages.value.findIndex(msg => msg.id === message.id)
        
        // If no exact match, try to find temporary messages that match content and sender
        if (existingMessageIndex === -1) {
          existingMessageIndex = chatMessages.value.findIndex(msg => 
            msg.isTemp && // Only match temporary messages
            msg.content === message.content && 
            msg.sender.id === message.sender.id && 
            Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
          )
        }
        
        if (existingMessageIndex >= 0) {
          // Update existing message, but preserve the server-generated ID if it's different
          const existingMessage = chatMessages.value[existingMessageIndex]
          console.log(`Found existing message at index ${existingMessageIndex}:`, {
            id: existingMessage.id,
            content: existingMessage.content,
            status: existingMessage.status,
            isTemp: existingMessage.isTemp
          })
          
          if (existingMessage.id !== message.id) {
            console.log(`Updating message ID from ${existingMessage.id} to ${message.id}`)
            // Remove the temporary flag since we now have a real ID
            message.isTemp = false
          }
          
          // Update the message with new status
          const updatedMessage = {
            ...existingMessage,
            ...message,
            id: message.id, // Use server-generated ID
            isTemp: false, // Remove temporary flag
            status: 'received' // Mark as received when saved to database
          }
          
          chatMessages.value[existingMessageIndex] = updatedMessage
          
          console.log(`Updated message:`, {
            id: updatedMessage.id,
            content: updatedMessage.content,
            status: updatedMessage.status,
            isTemp: updatedMessage.isTemp
          })
          
          // If this was our own message, update the status to show double tick
          if (message.sender.id === currentUser.value.id) {
            console.log(`Message ${message.id} status updated to 'received' - showing double tick`)
          }
        } else {
          // Add new message
          console.log(`Adding new message to chatMessages:`, {
            id: message.id,
            content: message.content,
            status: message.status,
            isTemp: message.isTemp
          })
          chatMessages.value.push(message)
        }
        
        // Update badge count based on actual unread messages
        updateBadgeCount()
        
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'message_read':
      // Update message status to read
      console.log('Received message_read for messageId:', data.messageId)
      console.log('Available message IDs:', chatMessages.value.map(m => ({ id: m.id, content: m.content.substring(0, 20), sender: m.sender.name })))
      const readMsg = chatMessages.value.find(msg => msg.id === data.messageId)
      if (readMsg) {
        console.log('Updating message status to read:', readMsg.id)
        console.log('Previous status:', readMsg.status)
        readMsg.status = 'read'
        console.log('New status:', readMsg.status)
        
        // Update badge count after message status changes
        updateBadgeCount()
      } else {
        console.log('Message not found for read status:', data.messageId)
      }
      break
      
    case 'message_history':
      // Load message history when connecting (team chat only)
      if (data.messages && Array.isArray(data.messages)) {
        const teamChatMessages = data.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp || msg.createdAt || msg.created_at || Date.now()),
          sender: {
            ...msg.sender,
            photo: convertPhotoToDataUrl(msg.sender?.photo) // Convert sender photo to base64
          }
        }))
        
        // Add team chat messages to the main messages array
        chatMessages.value.push(...teamChatMessages)
        
        // Update badge count after loading messages
        updateBadgeCount()
        
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'conversation_messages':
      // Load messages for a specific conversation
      if (data.messages && Array.isArray(data.messages)) {
        const conversationMessages = data.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp || msg.createdAt || msg.created_at || Date.now()),
          sender: {
            ...msg.sender,
            photo: convertPhotoToDataUrl(msg.sender?.photo) // Convert sender photo to base64
          }
        }))
        
        // Replace messages for this conversation
        if (data.conversationId === 'general') {
          // For team chat, replace all team chat messages
          chatMessages.value = chatMessages.value.filter(msg => 
            msg.message_type !== 'team_chat'
          )
          chatMessages.value.push(...conversationMessages)
        } else {
          // For direct messages, replace messages between these users
          chatMessages.value = chatMessages.value.filter(msg => 
            !(msg.message_type === 'direct_message' && 
              ((msg.sender.id === data.conversationId && msg.receiver_id === currentUser.value.id) ||
               (msg.sender.id === currentUser.value.id && msg.receiver_id === data.conversationId)))
          )
          chatMessages.value.push(...conversationMessages)
        }
        
        // Update badge count after loading conversation messages
        updateBadgeCount()
        
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'users_update':
      if (data.users) {
        // Convert photos for all users in the list
        const usersWithConvertedPhotos = data.users.map((user: any) => ({
          ...user,
          photo: convertPhotoToDataUrl(user.photo),
          avatar: convertPhotoToDataUrl(user.photo)
        }))
        
        // Update online status for existing support staff based on WebSocket data
        const onlineUserIds = usersWithConvertedPhotos.map((user: any) => user.id)
        onlineUsers.value = onlineUsers.value.map(user => {
          const onlineUser = usersWithConvertedPhotos.find(u => u.id === user.id)
          return {
            ...user,
            status: onlineUserIds.includes(user.id) ? 'online' : 'offline',
            isOnline: onlineUserIds.includes(user.id),
            // Update photo if available
            photo: onlineUser ? onlineUser.photo : user.photo,
            avatar: onlineUser ? onlineUser.avatar : user.avatar
          }
        })
        // Update badge count and online count when users list updates
        updateBadgeCount()
        // Force reactivity update for computed online count
        onlineCount.value = realOnlineCount.value
      }
      break
      
    case 'user_status_updated':
      // Update specific user's status in the online users list
      if (data.userId && data.status) {
        const userIndex = onlineUsers.value.findIndex(user => user.id === data.userId)
        if (userIndex >= 0) {
          onlineUsers.value[userIndex].status = data.status
          console.log(`Updated user ${data.userId} status to ${data.status}`)
          // Update badge count when user status changes
          updateBadgeCount()
        }
      }
      break
      
    case 'user_joined':
      if (data.user && data.user.id !== currentUser.value.id) {
        // Convert user photo to base64 data URL if it's Buffer data
        const userWithConvertedPhoto = {
          ...data.user,
          photo: convertPhotoToDataUrl(data.user.photo),
          avatar: convertPhotoToDataUrl(data.user.photo)
        }
        
        // Update existing user's status to online
        const userIndex = onlineUsers.value.findIndex(user => user.id === data.user.id)
        if (userIndex >= 0) {
          onlineUsers.value[userIndex].status = 'online'
          onlineUsers.value[userIndex].isOnline = true
          // Also update photo if it changed
          onlineUsers.value[userIndex].photo = userWithConvertedPhoto.photo
          onlineUsers.value[userIndex].avatar = userWithConvertedPhoto.avatar
        } else {
          // If user not in list, add them (shouldn't happen but safety check)
          onlineUsers.value.push(userWithConvertedPhoto)
        }
        // Update badge count and online count when user joins
        updateBadgeCount()
        // Force reactivity update for computed online count
        onlineCount.value = realOnlineCount.value
      }
      break
      
    case 'user_left':
      if (data.user) {
        // Update existing user's status to offline instead of removing them
        const userIndex = onlineUsers.value.findIndex(user => user.id === data.user.id)
        if (userIndex >= 0) {
          onlineUsers.value[userIndex].status = 'offline'
          onlineUsers.value[userIndex].isOnline = false
        }
        // Update badge count and online count when user leaves
        updateBadgeCount()
        // Force reactivity update for computed online count
        onlineCount.value = realOnlineCount.value
      }
      break
  }
}



// Send message
const sendMessage = () => {
  if (!currentMessage.value.trim()) return
  
  // Create a temporary message object without an ID
  // The server will generate the real ID when saving to database
  const message = {
    content: currentMessage.value,
    sender: {
      ...currentUser.value,
      photo: convertPhotoToDataUrl(userPhoto.value || currentUser.value.avatar) // Use API photo if available
    },
    receiver_id: activeConversation.value === 'general' ? null : activeConversation.value,
    timestamp: new Date(),
    type: 'text',
    message_type: activeConversation.value === 'general' ? 'team_chat' : 'direct_message',
    status: 'sending'
  }
  
  // Add message to local state immediately with a temporary ID
  // This will be replaced when we get the server response
  const tempMessage = {
    ...message,
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isTemp: true // Flag to identify temporary messages
  }
  
  chatMessages.value.push(tempMessage)
  currentMessage.value = ''
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      message: message,
      to: activeConversation.value === 'general' ? 'all' : activeConversation.value
    }))
    
    // Update status to sent after sending
    tempMessage.status = 'sent'
    
    // Trigger status update animation
    triggerStatusAnimation(tempMessage.id)
    
    // Simulate delivery after a short delay (in real implementation, this would come from server)
    setTimeout(() => {
      if (tempMessage.status === 'sent') {
        tempMessage.status = 'received'
        // Trigger status update animation
        triggerStatusAnimation(tempMessage.id)
      }
    }, 2000)
  } else {
    // For demo purposes when WebSocket is not available, simulate message delivery
    setTimeout(() => {
      tempMessage.status = 'sent'
      // Trigger status update animation
      triggerStatusAnimation(tempMessage.id)
    }, 500)
    
    setTimeout(() => {
      if (tempMessage.status === 'sent') {
        tempMessage.status = 'received'
        // Trigger status update animation
        triggerStatusAnimation(tempMessage.id)
      }
    }, 2000)
  }
  
  // Scroll to bottom after a short delay to ensure the message is rendered
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

// Update user status
const updateUserStatus = (newStatus: string) => {
  userStatus.value = newStatus
  
  // Save to localStorage
  localStorage.setItem('chatUserStatus', newStatus)
  
  // Update current user's status in the onlineUsers list
  const currentUserIndex = onlineUsers.value.findIndex(user => user.id === currentUser.value.id)
  if (currentUserIndex >= 0) {
    // Preserve the existing photo when updating status
    const currentPhoto = onlineUsers.value[currentUserIndex].photo || convertPhotoToDataUrl(currentUser.value.avatar)
    onlineUsers.value[currentUserIndex] = {
      ...onlineUsers.value[currentUserIndex],
      status: newStatus,
      isOnline: newStatus === 'online',
      photo: currentPhoto, // Ensure photo is preserved
      avatar: currentPhoto // Keep avatar consistent
    }
  }
  
  // Send to server if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'status_update',
      userId: currentUser.value.id,
      status: newStatus
    }))
  }
}

// Cycle through user status on click
const cycleUserStatus = () => {
  const statuses = ['online', 'away', 'busy']
  const currentIndex = statuses.indexOf(userStatus.value)
  const nextIndex = (currentIndex + 1) % statuses.length
  updateUserStatus(statuses[nextIndex])
}

// Load saved status
const loadUserStatus = () => {
  const saved = localStorage.getItem('chatUserStatus')
  if (saved) {
    userStatus.value = saved
  } else {
    userStatus.value = 'online'
  }
}


// Utility function to convert Buffer photo data to base64 data URL (fallback for any remaining Buffer data)
const convertPhotoToDataUrl = (photoData: any): string => {
  if (!photoData) return '/assets/imgs/avatar.jpg'
  
  // If it's already a data URL or regular URL, return as is
  if (typeof photoData === 'string') {
    if (photoData.startsWith('data:') || photoData.startsWith('http') || photoData.startsWith('/')) {
      return photoData
    }
  }
  
  // If it's Buffer data, convert to base64 (fallback for any remaining Buffer data)
  if (photoData && photoData.type === 'Buffer' && Array.isArray(photoData.data)) {
    try {
      const base64 = btoa(String.fromCharCode(...photoData.data))
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.warn('Failed to convert Buffer photo to base64:', error)
      return '/assets/imgs/avatar.jpg'
    }
  }
  
  // If it's a regular Buffer object
  if (photoData && typeof photoData === 'object' && photoData.buffer) {
    try {
      const uint8Array = new Uint8Array(photoData.buffer)
      const base64 = btoa(String.fromCharCode(...uint8Array))
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.warn('Failed to convert Buffer photo to base64:', error)
      return '/assets/imgs/avatar.jpg'
    }
  }
  
  // If it's a Uint8Array directly
  if (photoData && photoData instanceof Uint8Array) {
    try {
      const base64 = btoa(String.fromCharCode(...photoData))
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.warn('Failed to convert Uint8Array photo to base64:', error)
      return '/assets/imgs/avatar.jpg'
    }
  }
  
  // If it's an ArrayBuffer
  if (photoData && photoData instanceof ArrayBuffer) {
    try {
      const uint8Array = new Uint8Array(photoData)
      const base64 = btoa(String.fromCharCode(...uint8Array))
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.warn('Failed to convert ArrayBuffer photo to base64:', error)
      return '/assets/imgs/avatar.jpg'
    }
  }
  
  // If it's a Blob, convert to base64 (synchronous fallback)
  if (photoData && photoData instanceof Blob) {
    try {
      // For now, return default avatar since Blob conversion is async
      // In a real implementation, you might want to handle this differently
      console.warn('Blob photo detected - using default avatar (Blob conversion requires async handling)')
      return '/assets/imgs/avatar.jpg'
    } catch (error) {
      console.warn('Failed to handle Blob photo:', error)
      return '/assets/imgs/avatar.jpg'
    }
  }
  
  return '/assets/imgs/avatar.jpg'
}

// Support staff list (all support users, not necessarily online)
const supportStaff = ref<any[]>([])
const getSupportStaffList = async () => {
  console.log('getSupportStaffList..........')
  try {
    const res = await getChatUsersWithPhotos()
    console.log('getSupportStaffList response:', res)
    
    // Following the IResponse interface structure: { data, total, code }
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      console.log('Found', res.data.length, 'support users from API')
      supportStaff.value = res.data.map(user => ({
        ...user,
        photo: convertPhotoToDataUrl(user.photo), // Convert Buffer to base64 data URL
        avatar: convertPhotoToDataUrl(user.photo) // Keep avatar for backward compatibility
      }))
      
      // Initialize onlineUsers with all support staff (offline initially, will be updated by WebSocket)
      // Also add current user to the list
      const allUsers = [
        ...supportStaff.value.map(user => ({
          ...user,
          status: 'offline',
          isOnline: false
        })),
        {
          ...currentUser.value,
          photo: convertPhotoToDataUrl(currentUser.value.avatar), // Convert current user's avatar/photo
          avatar: convertPhotoToDataUrl(currentUser.value.avatar), // Keep avatar for consistency
          status: userStatus.value,
          isOnline: true
        }
      ]
      onlineUsers.value = allUsers
    } else if (res && res.data && Array.isArray(res.data) && res.data.length === 0) {
      console.log('API returned empty support user list')
      supportStaff.value = []
      onlineUsers.value = []
    } else {
      console.warn('Unexpected response structure:', res)
      console.warn('Response structure details:', {
        hasRes: !!res,
        resType: typeof res,
        resKeys: res ? Object.keys(res) : null,
        resData: res?.data,
        resDataType: typeof res?.data,
        isArray: Array.isArray(res?.data)
      })
      
      // Fallback: create some dummy support users for testing
      console.log('Creating fallback support users for testing...')
      supportStaff.value = [
        {
          id: 1,
          name: 'Test Support User 1',
          email: 'support1@example.com',
          photo: '/assets/imgs/avatar.jpg',
          avatar: '/assets/imgs/avatar.jpg',
          status: 'offline',
          isOnline: false
        },
        {
          id: 2,
          name: 'Test Support User 2',
          email: 'support2@example.com',
          photo: '/assets/imgs/avatar.jpg',
          avatar: '/assets/imgs/avatar.jpg',
          status: 'offline',
          isOnline: false
        }
      ]
      // Include current user in the list for fallback case
      const allUsers = [
        ...supportStaff.value.map(user => ({
          ...user,
          status: 'offline',
          isOnline: false
        })),
        {
          ...currentUser.value,
          photo: convertPhotoToDataUrl(currentUser.value.avatar), // Convert current user's avatar/photo
          avatar: convertPhotoToDataUrl(currentUser.value.avatar), // Keep avatar for consistency
          status: userStatus.value,
          isOnline: true
        }
      ]
      onlineUsers.value = allUsers
    }
  } catch (error) {
    console.error('Error getting support staff list:', error)
    
    // Fallback on error
    console.log('Creating fallback support users due to error...')
    supportStaff.value = [
      {
        id: 1,
        name: 'Test Support User 1',
        email: 'support1@example.com',
        photo: '/assets/imgs/avatar.jpg',
        avatar: '/assets/imgs/avatar.jpg',
        status: 'offline',
        isOnline: false
      },
      {
        id: 2,
        name: 'Test Support User 2',
        email: 'support2@example.com',
        photo: '/assets/imgs/avatar.jpg',
        avatar: '/assets/imgs/avatar.jpg',
        status: 'offline',
        isOnline: false
      }
    ]
      onlineUsers.value = supportStaff.value.map(user => ({
        ...user,
        status: 'offline',
        isOnline: false
      }))
    }
  }


// Handle Enter key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// Scroll to bottom of chat
const scrollToBottom = () => {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Format timestamp
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return 'Unknown'
  
  // Handle different timestamp formats
  let date: Date
  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    return 'Unknown'
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown'
  }
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Format last seen
const formatLastSeen = (timestamp: any) => {
  if (!timestamp) return 'Unknown'
  
  // Handle different timestamp formats
  let date: Date
  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    return 'Unknown'
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Unknown'
  }
  
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Get user status color
const getUserStatusColor = (status: string) => {
  switch (status) {
    case 'online': return '#67c23a'
    case 'away': return '#e6a23c'
    case 'busy': return '#f56c6c'
    default: return '#909399'
  }
}

// Open chat modal
const openModal = () => {
  visible.value = true
  drawerFocused.value = true
  lastViewedTime.value = new Date()
  
  // Mark all unread messages as read when drawer opens
  // This is the definitive "read" action - user opened drawer to view
  setTimeout(() => {
    markAllMessagesAsRead()
  }, 300) // Small delay to ensure drawer is fully opened
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Mark all unread messages as read
const markAllMessagesAsRead = () => {
  // Find messages that are 'received' (not read yet)
  // Skip temporary messages that don't have real IDs yet
  const unreadMessages = chatMessages.value.filter(msg => 
    msg.status === 'received' && // Only mark 'received' messages as read
    !msg.isTemp // Skip temporary messages
  )
  
  if (unreadMessages.length > 0) {
    console.log(`Marking ${unreadMessages.length} messages as read`)
    
    unreadMessages.forEach(msg => {
      // Update locally first
      msg.status = 'read'
      
      // Send to server if connected
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message_read',
          messageId: msg.id,
          readBy: currentUser.value.id
        }))
      }
    })
    
    // Update badge count after marking messages as read
    updateBadgeCount()
  }
}

// Update message status locally and on server
const updateMessageStatus = (messageId: string, status: string) => {
  console.log(`Updating message ${messageId} to status: ${status}`)
  
  // Update local message status
  const messageIndex = chatMessages.value.findIndex(msg => msg.id === messageId)
  if (messageIndex >= 0) {
    const message = chatMessages.value[messageIndex]
    
    // Skip temporary messages that don't have real IDs yet
    if (message.isTemp) {
      console.log(`Skipping temporary message ${messageId} - waiting for server ID`)
      return
    }
    
    console.log(`Found message locally, updating status from ${message.status} to ${status}`)
    message.status = status
    
    // Trigger status update animation
    triggerStatusAnimation(messageId)
    
    // Update badge count after changing message status
    updateBadgeCount()
  } else {
    console.log(`Message not found locally:`, messageIndex, messageId)
  }
  
  // Send status update to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message_read',
      messageId: messageId,
      readBy: currentUser.value.id
    }))
  }
}

// Trigger status update animation
const triggerStatusAnimation = (messageId: string) => {
  nextTick(() => {
    const statusIcon = document.querySelector(`[data-message-id="${messageId}"] .message-status .iconify, [data-message-id="${messageId}"] .mobile-message-status .iconify`)
    if (statusIcon) {
      statusIcon.classList.add('status-updated')
      setTimeout(() => {
        statusIcon.classList.remove('status-updated')
      }, 300)
    }
  })
}

// Mark individual message as read when it comes into view
const markMessageAsRead = (messageId: string) => {
  updateMessageStatus(messageId, 'read')
}

// Jump to next unread conversation
const jumpToNextUnread = () => {
  // First check team chat
  if (getUnreadCount('general') > 0) {
    switchConversation('general')
    return
  }
  
  // Then check direct messages
  const userWithUnread = onlineUsers.value.find(user => 
    user.id !== currentUser.value.id && getUnreadCount(user.id) > 0
  )
  
  if (userWithUnread) {
    switchConversation(userWithUnread.id)
    // Auto-scroll to first unread message
    nextTick(() => {
      setTimeout(() => {
        scrollToFirstUnread()
      }, 300)
    })
  }
}

// Scroll to first unread message in current conversation
const scrollToFirstUnread = () => {
  if (!chatContainer.value) return
  
  const unreadMessages = filteredMessages.value.filter(msg => 
    msg.status === 'received' && msg.sender.id !== currentUser.value.id
  )
  
  if (unreadMessages.length > 0) {
    const firstUnread = unreadMessages[0]
    const messageElement = document.querySelector(`[data-message-id="${firstUnread.id}"]`)
    
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      
      // Highlight the message briefly
      messageElement.classList.add('highlight-unread')
      setTimeout(() => {
        messageElement.classList.remove('highlight-unread')
      }, 2000)
    }
  }
}

// Get total unread count for direct messages
const getTotalDirectUnreadCount = () => {
  return onlineUsers.value
    .filter(u => u.id !== currentUser.value.id)
    .reduce((sum, user) => sum + getUnreadCount(user.id), 0)
}

// Calculate real online count (excluding current user)
const realOnlineCount = computed(() => {
  return onlineUsers.value.filter(user => 
    user.id !== currentUser.value.id && 
    user.status === 'online' && 
    user.isOnline
  ).length
})

// Sort online users by unread count (unread first) - include current user
const sortedOnlineUsers = computed(() => {
  return [...onlineUsers.value]
    .sort((a, b) => {
      const aUnread = getUnreadCount(a.id)
      const bUnread = getUnreadCount(b.id)
      
      // Sort by unread count (descending)
      if (aUnread !== bUnread) {
        return bUnread - aUnread
      }
      
      // Then by online status
      const aOnline = a.status === 'online'
      const bOnline = b.status === 'online'
      if (aOnline !== bOnline) {
        return aOnline ? -1 : 1
      }
      
      // Finally by name
      return a.name.localeCompare(b.name)
    })
})



// Switch between conversations
const switchConversation = (conversationId: string) => {
  activeConversation.value = conversationId
  // Auto-hide sidebar on mobile after selection
  if (isMobile.value) {
    showUsersSidebar.value = false
  }
  
  // Request conversation messages from server
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'switch_conversation',
      conversationId: conversationId
    }))
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Update badge count based on actual unread messages
const updateBadgeCount = () => {
  // Calculate total unread count across all conversations
  const totalUnreadCount = getUnreadCount('general') + 
    onlineUsers.value
      .filter(u => u.id !== currentUser.value.id)
      .reduce((sum, user) => sum + getUnreadCount(user.id), 0)
  
  // Update local unread count
  unreadCount.value = totalUnreadCount
  
  // Emit to parent component to update badge
  emit('updateUnreadCount', totalUnreadCount)
}

// Get unread count for specific conversation
const getUnreadCount = (conversationId: string) => {
  if (conversationId === 'general') {
    // Team chat: count unread broadcast messages from support users
    const count = chatMessages.value.filter(msg => 
      !msg.receiver_id && 
      msg.message_type === 'team_chat' &&
      msg.sender.id !== currentUser.value.id && 
      msg.status === 'received' // Only count 'received' messages as unread
    ).length
    return count
  } else {
    // Direct messages: count unread messages from this specific user
    const count = chatMessages.value.filter(msg => 
      msg.sender.id === conversationId && 
      msg.receiver_id === currentUser.value.id && 
      msg.message_type === 'direct_message' &&
      msg.status === 'received' // Only count 'received' messages as unread
    ).length
    return count
  }
}

// Close chat modal
const closeModal = () => {
  visible.value = false
  drawerFocused.value = false
  showUsersSidebar.value = false
  // Don't auto-mark as read on close - only when user actively opens drawer
}

// Expose methods for parent component
defineExpose({
  openModal,
  closeModal
})

// Window focus tracking for drawer state
const handleWindowFocus = () => {
  if (visible.value) {
    drawerFocused.value = true
    lastViewedTime.value = new Date()
    // Don't auto-mark as read here - let badge count be the source of truth
  }
}

const handleWindowBlur = () => {
  drawerFocused.value = false
}

// Lifecycle
onMounted(() => {
  loadUserStatus()
  getUserPhoto() // Get user photo from API like profile module
  connectWebSocket()
  getSupportStaffList()
  // Add window focus/blur listeners for better read tracking
  window.addEventListener('focus', handleWindowFocus)
  window.addEventListener('blur', handleWindowBlur)
  
  // Add visibility change listener
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && visible.value) {
      drawerFocused.value = true
      lastViewedTime.value = new Date()
      // Don't auto-mark as read - badge system handles this
    } else {
      drawerFocused.value = false
    }
  })
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  
  // Remove event listeners
  window.removeEventListener('focus', handleWindowFocus)
  window.removeEventListener('blur', handleWindowBlur)
})

// Watch for new messages to scroll and update badge count
watch(chatMessages, () => {
  nextTick(() => {
    scrollToBottom()
  })
  // Update badge count when messages change
  updateBadgeCount()
}, { deep: true })

// Watch for drawer visibility changes to mark messages as read
watch(visible, (newVisible) => {
  if (newVisible) {
    // When drawer opens, refresh support staff list and mark all messages as read
    getSupportStaffList() // Refresh support staff list with photos
    
    setTimeout(() => {
      markAllMessagesAsRead()
    }, 500)
    
    // Notify server that drawer is open
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'drawer_state',
        isOpen: true
      }))
    }
  } else {
    // Notify server that drawer is closed
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'drawer_state',
        isOpen: false
      }))
    }
    
    // Update badge count when drawer closes
    updateBadgeCount()
  }
})

// Watch for active conversation changes to update badge count
watch(activeConversation, () => {
  // Update badge count when switching conversations
  updateBadgeCount()
})

// Watch for online users changes to update badge count
watch(onlineUsers, () => {
  // Update badge count when online users list changes
  updateBadgeCount()
}, { deep: true })

// Watch for current user changes to update badge count
watch(currentUser, () => {
  // Update badge count when current user changes
  updateBadgeCount()
}, { deep: true })

// Watch for user status changes to update badge count
watch(userStatus, () => {
  // Update badge count when user status changes
  updateBadgeCount()
})

// Watch for sidebar visibility changes to update badge count
watch(showUsersSidebar, () => {
  // Update badge count when sidebar opens/closes
  updateBadgeCount()
})

// Mobile responsive
const isMobile = computed(() => appStore.getMobile || window.innerWidth <= 768)
const sMobile = computed(() => '100%')
const drawerSize = computed(() => isMobile.value ? '100%' : '25%')
const isTablet = computed(() => window.innerWidth > 768 && window.innerWidth <= 1024)
const drawerSizeTablet = computed(() => isTablet.value ? '50%' : drawerSize.value)

// Active conversation info
const activeConversationInfo = computed(() => {
  if (activeConversation.value === 'general') {
    return {
      title: 'Team Chat',
      subtitle: `${realOnlineCount.value} online`,
      icon: 'material-symbols:forum'
    }
  } else {
    const user = onlineUsers.value.find(u => u.id === activeConversation.value)
    return {
      title: user?.name || 'Direct Message',
      subtitle: user?.status || 'offline',
      icon: 'material-symbols:person'
    }
  }
})

// Filtered messages for active conversation
const filteredMessages = computed(() => {
  let filtered: any[]
  if (activeConversation.value === 'general') {
    // Team chat: show only broadcast messages (no receiver_id) from support users
    filtered = chatMessages.value.filter(msg => 
      !msg.receiver_id && 
      msg.message_type === 'team_chat'
      // Show temporary messages so they appear immediately
    )
  } else {
    // Direct messages: show only messages between these two specific users
    filtered = chatMessages.value.filter(msg => 
      // Show temporary messages so they appear immediately
      ((msg.sender.id === activeConversation.value && msg.receiver_id === currentUser.value.id) ||
       (msg.sender.id === currentUser.value.id && msg.receiver_id === activeConversation.value))
    )
  }
  
  return filtered
})

// Get user avatar for direct messages
const getUserAvatar = (userId: string) => {
  if (userId === 'general') return ''
  const user = onlineUsers.value.find(u => u.id === userId)
  return user?.photo || ''
}

</script>

<template>
  <el-drawer
    v-model="visible"
    title="Chat"
    :size="isMobile ? '100%' : drawerSize"
    direction="rtl"
    class="chat-drawer"
    
    :before-close="closeModal"
    :with-header="true"
  >
    <!-- Mobile Header (when header is hidden) -->
    <template #header v-if="isMobile">
      <div class="mobile-drawer-header">
        <div class="mobile-header-left">
          <!-- Mobile Menu Button -->
          <el-button 
            @click="showUsersSidebar = !showUsersSidebar"
            type="text"
            class="mobile-menu-btn"
            :class="{ 'active': showUsersSidebar }"
          >
            <Icon icon="material-symbols:menu" width="20" />
          </el-button>
        </div>
        
        <div class="mobile-header-center">
          <div class="mobile-conversation-info">
            <!-- Show avatar for direct messages, icon for team chat -->
            <div v-if="activeConversation !== 'general'" class="mobile-user-avatar">
              <el-avatar 
                :size="32" 
                :src="getUserAvatar(activeConversation)"
                :title="activeConversationInfo.title"
              >
                {{ activeConversationInfo.title.charAt(0).toUpperCase() }}
              </el-avatar>
            </div>
            <Icon 
              v-else 
              :icon="activeConversationInfo.icon" 
              width="24" 
              color="var(--el-color-primary)" 
            />
            <span class="mobile-conversation-title">{{ activeConversationInfo.title }}</span>
          </div>
        </div>
        
        <div class="mobile-header-right">
          <!-- Unread Messages Indicator -->
          <div 
            v-if="unreadCount > 0" 
            class="mobile-unread-indicator"
            @click="jumpToNextUnread"
          >
            <Icon icon="material-symbols:mark-email-unread" width="18" color="#f56c6c" />
            <span class="mobile-unread-count">{{ unreadCount }}</span>
          </div>
          
          <!-- Current User Avatar with Status Color Circle (Mobile) -->
          <div 
            class="current-user-avatar-status mobile"
            @click="cycleUserStatus"
            :title="`You are ${userStatus} - Click to change status`"
          >
            <el-avatar 
              :size="28" 
              :src="convertPhotoToDataUrl(userPhoto || currentUser.avatar)"
              class="current-user-avatar"
              :style="{ borderColor: getUserStatusColor(userStatus) }"
            >
              {{ currentUser.name.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
        </div>
      </div>
    </template>

    <!-- Desktop Header -->
    <template #header v-else>
      <div class="drawer-header">
        <div class="header-left">
          <!-- Active Conversation Info -->
          <div class="conversation-info">
            <Icon :icon="activeConversationInfo.icon" width="18" color="var(--el-text-color-primary)" />
            <span class="conversation-title">{{ activeConversationInfo.title }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- Unread Messages Indicator -->
          <div 
            v-if="unreadCount > 0" 
            class="unread-indicator"
            @click="jumpToNextUnread"
            :title="`${unreadCount} unread messages - Click to jump to next unread`"
          >
            <Icon icon="material-symbols:mark-email-unread" width="16" color="#f56c6c" />
            <span class="unread-count">{{ unreadCount }}</span>
          </div>
          
          <!-- Online Users Preview (Always Visible) -->
          <div class="online-users-preview" @click="showUsersSidebar = !showUsersSidebar">
            <div class="online-avatars">
              <div 
                v-for="(user, index) in onlineUsers.slice(0, 3)" 
                :key="user.id"
                class="online-avatar"
                :style="{ 
                  zIndex: 3 - index,
                  marginLeft: index > 0 ? '-8px' : '0'
                }"
                :title="`${user.name} (${user.status})`"
              >
                <el-avatar :size="24" :src="user.photo">
                  {{ user.name.charAt(0).toUpperCase() }}
                </el-avatar>
                <div 
                  class="status-dot" 
                  :style="{ backgroundColor: getUserStatusColor(user.status) }"
                ></div>
              </div>
              <div v-if="onlineUsers.length > 3" class="more-users">
                +{{ onlineUsers.length - 3 }}
              </div>
            </div>
            <span class="online-label">{{ realOnlineCount }} online</span>
          </div>
          
          <!-- Current User Avatar with Status Color Circle -->
          <div 
            class="current-user-avatar-status"
            @click="cycleUserStatus"
            :title="`You are ${userStatus} - Click to change status`"
          >
            <el-avatar 
              :size="32" 
              :src="convertPhotoToDataUrl(userPhoto || currentUser.avatar)"
              class="current-user-avatar"
              :style="{ borderColor: getUserStatusColor(userStatus) }"
            >
              {{ currentUser.name.charAt(0).toUpperCase() }}
            </el-avatar>
          </div>
          
          <!-- Connection Status -->
          <Icon v-if="!isConnected" icon="material-symbols:wifi-off" width="16" color="#f56c6c" title="Offline" />
        </div>
      </div>
    </template>

    <div class="chat-container" :class="{ 'mobile-chat-container': isMobile }">

      <!-- Users Sidebar -->
      <div 
        v-if="showUsersSidebar" 
        class="users-sidebar"
        :class="{ 'mobile-users-sidebar': isMobile }"
        :style="{ width: isMobile ? '100%' : sidebarWidth }"
      >
        <!-- Mobile Sidebar Header -->
        <div v-if="isMobile" class="mobile-sidebar-header">
       
          <el-button 
            @click="showUsersSidebar = false"
            type="text"
            class="close-sidebar-btn"
          >
            <Icon icon="material-symbols:close" width="20" />
          </el-button>
        </div>
        
        <div class="sidebar-content">
          <!-- General Chat -->
          <div 
            class="conversation-item"
            :class="{ active: activeConversation === 'general' }"
            @click="switchConversation('general')"
          >
            <div class="conversation-avatar">
              <Icon icon="material-symbols:forum" width="24" color="var(--el-color-primary)" />
            </div>
            <div class="conversation-info">
              <div class="conversation-name">Team Chat</div>
              <div class="conversation-preview">General discussion</div>
            </div>
            <div class="conversation-badge" v-if="getUnreadCount('general') > 0">
              {{ getUnreadCount('general') }}
            </div>
          </div>
          
          <!-- Direct Messages -->
          <div class="sidebar-section">
            <div class="section-title">
              Direct Messages
              <span v-if="getTotalDirectUnreadCount() > 0" class="section-unread-count">
                ({{ getTotalDirectUnreadCount() }} unread)
              </span>
            </div>
            <div 
              v-for="user in sortedOnlineUsers" 
              :key="user.id"
              class="conversation-item"
              :class="{ 
                active: activeConversation === user.id,
                'has-unread': getUnreadCount(user.id) > 0
              }"
              @click="switchConversation(user.id)"
            >
              <div class="conversation-avatar">
                              <el-avatar :size="32" :src="user.photo" class="user-avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </el-avatar>
                <div 
                  class="status-dot" 
                  :style="{ backgroundColor: getUserStatusColor(user.status) }"
                ></div>
              </div>
              <div class="conversation-info">
                <div class="conversation-name">
                  {{ user.name }}
                  <span v-if="getUnreadCount(user.id) > 0" class="unread-indicator-text">
                    • {{ getUnreadCount(user.id) }} new
                  </span>
                </div>
                <div class="conversation-preview">{{ user.status }}</div>
              </div>
              <div class="conversation-badge" v-if="getUnreadCount(user.id) > 0">
                {{ getUnreadCount(user.id) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Desktop Layout -->
      <div v-if="!isMobile" class="desktop-layout" :style="{ marginLeft: showUsersSidebar ? sidebarWidth : '0' }">
        
        <!-- Messages -->
        <div ref="chatContainer" class="chat-messages">
          <div v-if="filteredMessages.length === 0" class="no-messages">
            <Icon icon="material-symbols:chat-bubble-outline" width="48" color="var(--el-text-color-placeholder)" />
            <p v-if="activeConversation === 'general'">No messages in team chat yet. Start the conversation!</p>
            <p v-else>No messages with this user yet. Start the conversation!</p>
            <div class="welcome-tips">
              <p class="tip-title">💡 Quick Tips:</p>
              <ul class="tip-list">
                <li>Use the <strong>Quick Access</strong> bar above to switch conversations</li>
                <li>Click on user avatars to start direct messages</li>
                <li>Use <strong>Team Chat</strong> for group discussions</li>
              </ul>
            </div>
          </div>
          
          <div v-for="message in filteredMessages" :key="message.id" class="message-container" :data-message-id="message.id">
            <div 
              :class="[
                'message', 
                message.sender.id === currentUser.id ? 'own-message' : 'other-message'
              ]"
            >
              <el-avatar 
                v-if="message.sender.id !== currentUser.id"
                :size="32" 
                :src="message.sender.photo"
                class="message-avatar"
              >
                <Icon icon="material-symbols:person" />
              </el-avatar>
              
              <div class="message-content">
                <div v-if="message.sender.id !== currentUser.id" class="message-sender">
                  {{ message.sender.name }}
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div class="message-footer">
                  <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
                  <span v-if="message.sender.id === currentUser.id" class="message-status">
                     <Icon 
                       v-if="message.status === 'sending'" 
                       icon="material-symbols:schedule" 
                       width="12" 
                       color="#909399" 
                       title="Sending..."
                     />
                     <Icon 
                       v-else-if="message.status === 'sent'" 
                       icon="material-symbols:done" 
                       width="12" 
                       color="#909399" 
                       title="Sent"
                     />
                     <Icon 
                       v-else-if="message.status === 'received'" 
                       icon="material-symbols:done-all" 
                       width="14" 
                       color="#909399" 
                       title="Delivered"
                     />
                     <Icon 
                       v-else-if="message.status === 'read'" 
                       icon="material-symbols:done-all" 
                       width="14" 
                       color="#1976d2" 
                       title="Read"
                     />
                     <Icon 
                       v-else-if="message.status === 'failed'" 
                       icon="material-symbols:error" 
                       width="12" 
                       color="#f56c6c" 
                       title="Failed to send"
                       />
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="chat-input-container">
          <div class="input-wrapper">
            <el-input
              v-model="currentMessage"
              placeholder="Type your message..."
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              @keydown="handleKeyDown"
              class="message-input"
            />
            <el-button 
              @click="sendMessage" 
              type="primary" 
              :disabled="!currentMessage.trim()"
              class="send-button"
            >
              <Icon icon="material-symbols:send" width="16" />
            </el-button>
          </div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div v-else class="mobile-layout">
        
        <!-- Mobile Messages -->
        <div ref="chatContainer" class="mobile-chat-messages">
          <div v-if="filteredMessages.length === 0" class="no-messages">
            <Icon icon="material-symbols:chat-bubble-outline" width="48" color="var(--el-text-color-placeholder)" />
            <p v-if="activeConversation === 'general'">No messages in team chat yet. Start the conversation!</p>
            <p v-else>No messages with this user yet. Start the conversation!</p>
            <div class="welcome-tips">
              <p class="tip-title">💡 Quick Tips:</p>
              <ul class="tip-list">
                <li>Tap the <strong>menu button</strong> to switch conversations</li>
                <li>Use <strong>Team Chat</strong> for group discussions</li>
                <li>Swipe to see more options</li>
              </ul>
            </div>
          </div>
          
          <div v-for="message in filteredMessages" :key="message.id" class="mobile-message-container" :data-message-id="message.id">
            <div 
              :class="[
                'mobile-message', 
                message.sender.id === currentUser.id ? 'mobile-own-message' : 'mobile-other-message'
              ]"
            >
              <div class="mobile-message-content">
                <div v-if="message.sender.id !== currentUser.id" class="mobile-message-sender">
                  {{ message.sender.name }}
                </div>
                <div class="mobile-message-text">{{ message.content }}</div>
                <div class="mobile-message-footer">
                  <span class="mobile-message-time">{{ formatTimestamp(message.timestamp) }}</span>
                  <span v-if="message.sender.id === currentUser.id" class="mobile-message-status">
                     <Icon 
                       v-if="message.status === 'sending'" 
                       icon="material-symbols:schedule" 
                       width="12" 
                       color="#909399"
                       title="Sending..."
                     />
                     <Icon 
                       v-else-if="message.status === 'sent'" 
                       icon="material-symbols:done" 
                       width="12" 
                       color="#909399"
                       title="Sent"
                     />
                     <Icon 
                       v-else-if="message.status === 'received'" 
                       icon="material-symbols:done-all" 
                       width="14" 
                       color="#909399"
                       title="Delivered"
                     />
                     <Icon 
                       v-else-if="message.status === 'read'" 
                       icon="material-symbols:done-all" 
                       width="14" 
                       color="#1976d2"
                       title="Read"
                     />
                     <Icon 
                       v-else-if="message.status === 'failed'" 
                       icon="material-symbols:error" 
                       width="12" 
                       color="#f56c6c"
                       title="Failed to send"
                       />
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Input -->
        <div class="mobile-chat-input">
          <div class="mobile-input-wrapper">
            <el-input
              v-model="currentMessage"
              placeholder="Type your message..."
              @keydown="handleKeyDown"
              class="mobile-message-input"
            />
            <el-button 
              @click="sendMessage" 
              type="primary" 
              :disabled="!currentMessage.trim()"
              class="mobile-send-button"
            >
              <Icon icon="material-symbols:send" width="16" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.chat-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.chat-container {
  height: calc(100vh - 120px);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0;
}

.drawer-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.members-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.members-select :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.members-select :deep(.el-select-dropdown__item) {
  padding: 8px 16px;
  min-height: 36px;
}

.members-select :deep(.el-select-dropdown__item:hover) {
  background-color: var(--el-color-primary-light-9);
}

.user-status-container {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.status-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.status-select :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary);
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.member-option {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 4px 0;
}

.member-avatar-container {
  position: relative;
  display: inline-block;
}

.member-status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
  bottom: -1px;
  right: -1px;
  border: 2px solid var(--el-bg-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.member-name {
  flex: 1;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.member-status-text {
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
  opacity: 0.8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-count {
  font-size: 12px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.connection-status {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.connection-status.connected {
  color: var(--el-color-success);
}

.connection-status.offline {
  color: var(--el-color-danger);
}

/* Desktop Layout */
.desktop-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Removed users panel styles - now just messages and input */

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--el-bg-color);
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.no-messages p {
  margin-top: 12px;
  font-size: 14px;
}

.welcome-tips {
  margin-top: 20px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  max-width: 400px;
}

.tip-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  font-size: 13px;
}

.tip-list {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.tip-list li {
  margin-bottom: 4px;
}

.tip-list strong {
  color: var(--el-text-color-primary);
}

.message-container {
  margin-bottom: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message.own-message {
  flex-direction: row-reverse;
}

.message.own-message .message-content {
  text-align: right;
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border-radius: 16px 4px 16px 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.message.other-message .message-content {
  background: var(--el-fill-color-light);
  border-radius: 4px 16px 16px 16px;
}

.message-avatar {
  margin-top: 4px;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 16px;
}

.message-sender {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  gap: 8px;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

.message-status .iconify {
  transition: all 0.2s ease;
}

.message-status .iconify:hover {
  transform: scale(1.1);
}

@keyframes statusUpdate {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.message-status .iconify.status-updated {
  animation: statusUpdate 0.3s ease-in-out;
}

/* Highlight unread messages */
.highlight-unread {
  animation: highlightUnread 2s ease-in-out;
}

@keyframes highlightUnread {
  0%, 100% { 
    background-color: transparent;
    transform: scale(1);
  }
  25% { 
    background-color: var(--el-color-warning-light-9);
    transform: scale(1.02);
  }
  75% { 
    background-color: var(--el-color-warning-light-9);
    transform: scale(1.01);
  }
}

.chat-input-container {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
}

/* Mobile Header Layout */
.mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.mobile-header-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.mobile-header-center {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.mobile-conversation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.mobile-user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-conversation-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.mobile-menu-btn {
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mobile-menu-btn.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.mobile-unread-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-unread-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-color-danger);
  min-width: 14px;
  text-align: center;
}

.mobile-user-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid var(--el-bg-color);
}

.mobile-user-status-dot:hover {
  transform: scale(1.1);
}

/* Mobile Layout */
.mobile-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.mobile-message-container {
  margin-bottom: 12px;
}

.mobile-message {
  display: flex;
}

.mobile-message.mobile-own-message {
  justify-content: flex-end;
}

.mobile-message.mobile-own-message .mobile-message-content {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border-radius: 16px 4px 16px 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.mobile-message.mobile-other-message .mobile-message-content {
  background: var(--el-fill-color-light);
  border-radius: 4px 16px 16px 16px;
}

.mobile-message-content {
  max-width: 80%;
  padding: 8px 12px;
}

.mobile-message-sender {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.8;
}

.mobile-message-text {
  font-size: 14px;
  line-height: 1.4;
}

.mobile-message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  gap: 8px;
}

.mobile-message-time {
  font-size: 11px;
  opacity: 0.6;
}

.mobile-message-status {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
}

.mobile-message-status .iconify {
  transition: all 0.2s ease;
}

.mobile-message-status .iconify:hover {
  transform: scale(1.1);
}

.mobile-message-status .iconify.status-updated {
  animation: statusUpdate 0.3s ease-in-out;
}

.mobile-chat-input {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  position: sticky;
  bottom: 0;
  z-index: 50;
}

.mobile-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mobile-message-input {
  flex: 1;
}

.mobile-message-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  padding: 12px 20px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s ease;
}

.mobile-message-input :deep(.el-input__wrapper:focus-within) {
  background: var(--el-bg-color);
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.mobile-send-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.mobile-send-button:active {
  transform: scale(0.95);
}

/* Mobile Welcome Tips */
.mobile-layout .welcome-tips {
  margin-top: 24px;
  padding: 20px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  max-width: 100%;
}

.mobile-layout .tip-title {
  font-size: 14px;
  margin-bottom: 12px;
}

.mobile-layout .tip-list {
  font-size: 13px;
  line-height: 1.6;
}

.mobile-layout .tip-list li {
  margin-bottom: 8px;
}

/* Touch-friendly improvements */
.conversation-item {
  min-height: 56px;
  padding: 12px 16px;
}

.conversation-item:active {
  background-color: var(--el-fill-color);
  transform: scale(0.98);
}

/* Mobile scrollbar */
.mobile-chat-messages::-webkit-scrollbar {
  width: 4px;
}

.mobile-chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-chat-messages::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 2px;
}

.mobile-chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-light);
}

/* Mobile keyboard handling */
@media (max-height: 600px) {
  .mobile-chat-container {
    height: calc(100vh - 60px);
  }
  
  .mobile-drawer-header {
    padding: 12px 20px;
  }
  
  .mobile-chat-input {
    padding: 12px 20px;
  }
}

/* Landscape mobile optimizations */
@media (max-width: 768px) and (orientation: landscape) {
  .mobile-drawer-header {
    padding: 12px 20px;
  }
  
  .mobile-chat-input {
    padding: 12px 20px;
  }
  
  .mobile-message-content {
    padding: 10px 14px;
  }
}

/* High DPI mobile devices */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .mobile-message-content {
    box-shadow: 0 0.5px 1.5px rgba(0, 0, 0, 0.1);
  }
}

/* Dark mode mobile optimizations */
@media (prefers-color-scheme: dark) {
  .mobile-message-content {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  .mobile-users-sidebar {
    background: var(--el-bg-color-overlay);
  }
}

/* Drawer specific optimizations */
.chat-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.chat-drawer :deep(.el-drawer__close-btn) {
  font-size: 18px;
}

/* New Header Styles */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  border-bottom: 1px solid var(--el-border-color-light);
}

/* Unread Messages Indicator */
.unread-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: pulse 2s infinite;
}

.unread-indicator:hover {
  background: var(--el-color-danger-light-8);
  border-color: var(--el-color-danger-light-6);
  transform: scale(1.05);
}

.unread-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-danger);
  min-width: 16px;
  text-align: center;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Online Users Preview in Header */
.online-users-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--el-border-color-lighter);
}

.online-users-preview:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
}

.online-avatars {
  display: flex;
  align-items: center;
}

.online-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-avatar .status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border: 2px solid var(--el-bg-color);
}

.more-users {
  background: var(--el-color-primary);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.user-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid var(--el-bg-color);
}

.user-status-dot:hover {
  transform: scale(1.1);
}

.online-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.conversation-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conversation-details {
  display: flex;
  flex-direction: column;
}

.conversation-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.conversation-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

/* Users Sidebar Styles */
.users-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);
  z-index: 10;
  overflow: hidden;
}

.sidebar-content {
  height: 100%;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-section {
  margin-top: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  padding: 0 16px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-unread-count {
  font-size: 11px;
  color: var(--el-color-danger);
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.conversation-item:hover {
  background-color: var(--el-fill-color-light);
}

.conversation-item.active {
  background-color: var(--el-color-primary-light-9);
  border-right: 3px solid var(--el-color-primary);
}

.conversation-item.has-unread {
  background-color: var(--el-color-danger-light-9);
  border-left: 3px solid var(--el-color-danger);
}

.conversation-item.has-unread:hover {
  background-color: var(--el-color-danger-light-8);
}

.conversation-item.has-unread .conversation-name {
  font-weight: 600;
}

.conversation-avatar {
  position: relative;
  margin-right: 12px;
}

.conversation-avatar .status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--el-bg-color);
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-name {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-indicator-text {
  color: var(--el-color-danger);
  font-weight: 500;
  font-size: 11px;
}

.conversation-badge {
  background-color: var(--el-color-danger);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .users-sidebar {
    width: 100% !important;
  }
  
  .conversation-details {
    display: none;
  }
  
  .online-users-preview {
    padding: 4px 8px;
  }
  
  .online-label {
    font-size: 11px;
  }
}

@media (min-width: 769px) {
  .chat-container {
    position: relative;
  }
}

.refresh-status-btn:active {
  transform: scale(0.95);
}

/* Current User Avatar with Status Color Circle */
.current-user-avatar-status {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  border-radius: 50%;
  overflow: hidden;
}

.current-user-avatar-status:hover {
  transform: scale(1.05);
}

.current-user-avatar-status:active {
  transform: scale(0.95);
}

.current-user-avatar-status .current-user-avatar {
  border: 3px solid;
  transition: border-color 0.3s ease;
}

/* Mobile version */
.current-user-avatar-status.mobile .current-user-avatar {
  border-width: 2px;
}
</style>
