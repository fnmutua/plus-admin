<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { ElButton, ElInput, ElDrawer, ElAvatar } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

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
const showUsersSidebar = ref(false)
const activeConversation = ref<string>('general') // 'general' or user ID
const lastReadTimestamp = ref<number>(Date.now()) // Track when user last read messages

// WebSocket connection
let ws: WebSocket | null = null

// Current user info
const currentUser = computed(() => {
  const userInfo = wsCache.get(appStore.getUserInfo)
  return {
    id: userInfo?.id || 'anonymous',
    name: userInfo?.name || 'Anonymous User',
    email: userInfo?.email || '',
    avatar: userInfo?.photo || '/assets/imgs/avatar.jpg'
  }
})

// WebSocket connection
const connectWebSocket = () => {
  try {
    // Use environment variable for WebSocket URL, fallback to localhost for development
    const wsUrl = import.meta.env.CHAT_HOST || `ws://localhost:3001/chat`
    console.log('Connecting to WebSocket:', wsUrl)
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      isConnected.value = true
      
      // Send join message
      ws?.send(JSON.stringify({
        type: 'join',
        user: currentUser.value
      }))
      
      // Request initial message history
      setTimeout(() => {
        ws?.send(JSON.stringify({
          type: 'get_messages',
          conversation: activeConversation.value === 'general' ? 'general' : activeConversation.value,
          user_id: currentUser.value.id
        }))
      }, 500) // Small delay to ensure join is processed first
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
      console.log('WebSocket disconnected')
      isConnected.value = false
      setTimeout(connectWebSocket, 3000)
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    }
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error)
    isConnected.value = false
  }
}

// Handle incoming WebSocket messages
const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'message':
      if (data.message) {
        const message = {
          id: data.message.id || Date.now(),
          content: data.message.content,
          sender: data.message.sender,
          timestamp: new Date(data.message.timestamp || Date.now()),
          receiver_id: data.message.receiver_id,
          isRead: false // Mark new messages as unread
        }
        
        console.log('Received message:', message)
        
        // Check if message already exists to prevent duplicates
        const existingMessage = chatMessages.value.find(msg => 
          msg.content === message.content && 
          msg.sender.id === message.sender.id &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
        )
        
        if (!existingMessage) {
          chatMessages.value.push(message)
          // Only increment unread count if message is from someone else and chat is closed
          if (message.sender.id !== currentUser.value.id && !visible.value) {
            unreadCount.value++
            emit('updateUnreadCount', unreadCount.value)
          }
        }
        
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'message_history':
      if (data.messages) {
        console.log('Received message history:', data.messages)
        // Load existing messages from database
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          receiver_id: msg.receiver_id
        }))
        
        chatMessages.value = formattedMessages
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'conversation_messages':
      if (data.messages) {
        console.log('Received conversation messages:', data.messages)
        // Load messages for specific conversation
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          receiver_id: msg.receiver_id,
          isRead: true // Mark existing conversation messages as read
        }))
        
        chatMessages.value = formattedMessages
        nextTick(() => {
          scrollToBottom()
        })
      }
      break
      
    case 'users_update':
      if (data.users) {
        console.log('Online users update:', data.users)
        // ONLY show online users from WebSocket - no support filtering
        onlineUsers.value = data.users.filter((user: any) => user.id !== currentUser.value.id)
        updateBadgeCount()
      }
      break
      
    case 'user_joined':
      if (data.user && data.user.id !== currentUser.value.id) {
        console.log('User joined:', data.user)
        // Add user to online list if not already there
        const existingUser = onlineUsers.value.find(u => u.id === data.user.id)
        if (!existingUser) {
          onlineUsers.value.push(data.user)
        }
        updateBadgeCount()
      }
      break
      
    case 'user_left':
      if (data.user) {
        console.log('User left:', data.user)
        // Remove user from online list
        onlineUsers.value = onlineUsers.value.filter(u => u.id !== data.user.id)
        updateBadgeCount()
      }
      break
  }
}

// Send message
const sendMessage = () => {
  if (!currentMessage.value.trim()) return
  
  const message = {
    content: currentMessage.value,
    sender: currentUser.value,
    receiver_id: activeConversation.value === 'general' ? null : activeConversation.value,
    timestamp: new Date()
  }
  
  // Clear input immediately
  currentMessage.value = ''
  
  // Send to server - don't add locally, wait for server response
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      message: message,
      to: activeConversation.value === 'general' ? 'all' : activeConversation.value
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
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return 'Unknown'
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Open chat modal
const openModal = () => {
  visible.value = true
  
  // Mark all messages as read when chat opens
  chatMessages.value.forEach(msg => {
    if (msg.sender.id !== currentUser.value.id) {
      msg.isRead = true
    }
  })
  
  // Reset unread counter when chat opens
  unreadCount.value = 0
  emit('updateUnreadCount', 0)
  
  // Mark messages as read for current conversation
  markMessagesAsRead()
  
  // Request message history when chat opens
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'get_messages',
      conversation: activeConversation.value === 'general' ? 'general' : activeConversation.value,
      user_id: currentUser.value.id
    }))
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Close chat modal
const closeModal = () => {
  visible.value = false
  showUsersSidebar.value = false
}

// Expose methods for parent component
defineExpose({
  openModal,
  closeModal
})

// Mark messages as read when viewed
const markMessagesAsRead = () => {
  if (!visible.value) return // Only mark as read when chat is open
  
  let hasChanges = false
  
  chatMessages.value.forEach(msg => {
    if (msg.sender.id !== currentUser.value.id && !msg.isRead) {
      if (activeConversation.value === 'general') {
        // For team chat, mark messages without receiver_id as read
        if (!msg.receiver_id) {
          msg.isRead = true
          hasChanges = true
        }
      } else {
        // For direct messages, mark messages between these users as read
        if ((msg.sender.id === activeConversation.value && msg.receiver_id === currentUser.value.id) ||
            (msg.sender.id === currentUser.value.id && msg.receiver_id === activeConversation.value)) {
          msg.isRead = true
          hasChanges = true
        }
      }
    }
  })
  
  // Update counter if any messages were marked as read
  if (hasChanges) {
    updateBadgeCount()
  }
}

// Switch between conversations
const switchConversation = (conversationId: string) => {
  activeConversation.value = conversationId
  showUsersSidebar.value = false
  
  // Mark messages in this conversation as read
  markMessagesAsRead()
  
  // Request messages for this conversation
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'get_messages',
      conversation: conversationId === 'general' ? 'general' : conversationId,
      user_id: currentUser.value.id
    }))
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Update badge count
const updateBadgeCount = () => {
  // Only count unread messages from others
  const totalUnreadCount = chatMessages.value.filter(msg => 
    msg.sender.id !== currentUser.value.id && !msg.isRead
  ).length
  
  unreadCount.value = totalUnreadCount
  emit('updateUnreadCount', totalUnreadCount)
}

// Filtered messages for active conversation
const filteredMessages = computed(() => {
  if (activeConversation.value === 'general') {
    // Team chat: show messages without receiver_id
    return chatMessages.value.filter(msg => !msg.receiver_id)
  } else {
    // Direct messages: show messages between these two users
    return chatMessages.value.filter(msg => 
      (msg.sender.id === activeConversation.value && msg.receiver_id === currentUser.value.id) ||
      (msg.sender.id === currentUser.value.id && msg.receiver_id === activeConversation.value)
    )
  }
})

// Mobile responsive
const isMobile = computed(() => appStore.getMobile || window.innerWidth <= 768)
const drawerSize = computed(() => isMobile.value ? '100%' : '25%')

// Active conversation info
const activeConversationInfo = computed(() => {
  if (activeConversation.value === 'general') {
    return {
      title: 'Team Chat',
      subtitle: `${onlineUsers.value.length} online`,
      icon: 'material-symbols:forum'
    }
  } else {
    const user = onlineUsers.value.find(u => u.id === activeConversation.value)
    return {
      title: user?.name || 'Direct Message',
      subtitle: 'online',
      icon: 'material-symbols:person'
    }
  }
})

// Lifecycle
onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})

// Watch for new messages to scroll
watch(chatMessages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// Watch for drawer visibility changes
watch(visible, (newVisible) => {
  if (newVisible) {
    // Send drawer state to server with current conversation
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'drawer_state',
        isOpen: true,
        conversationId: activeConversation.value
      }));
    }
  } else {
    // Send drawer closed state
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'drawer_state',
        isOpen: false
      }));
    }
  }
});

// Get unread count for team chat
const getTeamUnreadCount = () => {
  const count = chatMessages.value.filter(msg => 
    msg.sender.id !== currentUser.value.id && !msg.isRead && !msg.receiver_id
  ).length;
  console.log('Team unread count:', count, chatMessages.value);
  return count;
};

// Get unread count for individual user
const getUserUnreadCount = (userId: string) => {
  const count = chatMessages.value.filter(msg => 
    msg.sender.id === userId && 
    msg.receiver_id === currentUser.value.id && 
    !msg.isRead
  ).length;
  console.log(`User ${userId} unread count:`, count);
  return count;
};
</script>

<template>
  <el-drawer
    v-model="visible"
    title="Chat"
    :size="drawerSize"
    direction="rtl"
    class="chat-drawer"
    :before-close="closeModal"
    :with-header="true"
  >
    <!-- Header -->
    <template #header>
      <div class="drawer-header">
        <div class="header-left">
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
          >
            <Icon icon="material-symbols:mark-email-unread" width="16" color="#f56c6c" />
            <span class="unread-count">{{ unreadCount }}</span>
          </div>
          
          <!-- Online Users Button -->
          <div class="online-users-btn" @click="showUsersSidebar = !showUsersSidebar">
            <Icon icon="material-symbols:people" width="18" />
            <div class="online-avatars">
              <el-avatar 
                v-for="user in onlineUsers.slice(0, 3)" 
                :key="user.id"
                :size="20" 
                :src="user.avatar"
                class="online-avatar"
              >
                {{ user.name.charAt(0).toUpperCase() }}
              </el-avatar>
              <span v-if="onlineUsers.length > 3" class="more-users">+{{ onlineUsers.length - 3 }}</span>
            </div>
            <span class="online-text">{{ onlineUsers.length }} online</span>
          </div>
          
          <!-- Connection Status -->
          <Icon v-if="!isConnected" icon="material-symbols:wifi-off" width="16" color="#f56c6c" title="Offline" />
        </div>
      </div>
    </template>

    <div class="chat-container">
      <!-- Users Sidebar -->
      <div 
        v-if="showUsersSidebar" 
        class="users-sidebar"
      >
        <div class="sidebar-header">
          <h3>Online Users</h3>
          <el-button @click="showUsersSidebar = false" type="text" size="small">
            <Icon icon="material-symbols:close" width="16" />
          </el-button>
        </div>
        
        <div class="sidebar-content">
          <!-- Team Chat -->
          <div 
            class="conversation-item"
            :class="{ active: activeConversation === 'general' }"
            @click="switchConversation('general')"
          >
            <div>
              <Icon icon="material-symbols:forum" width="24" color="var(--el-color-primary)" />
              <span>Team Chat</span>
            </div>
            <div 
              v-if="getTeamUnreadCount() > 0" 
              class="unread-badge"
            >
              {{ getTeamUnreadCount() }}
            </div>
          </div>
          
          <!-- Direct Messages -->
          <div 
            v-for="user in onlineUsers" 
            :key="user.id"
            class="conversation-item"
            :class="{ active: activeConversation === user.id }"
            @click="switchConversation(user.id)"
          >
            <el-avatar :size="24" :src="user.avatar">
              {{ user.name.charAt(0).toUpperCase() }}
            </el-avatar>
            <span>{{ user.name }}</span>
            <div 
              v-if="getUserUnreadCount(user.id) > 0" 
              class="unread-badge"
            >
              {{ getUserUnreadCount(user.id) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="chat-area" :class="{ 'hidden': showUsersSidebar }">
        <!-- Messages -->
        <div ref="chatContainer" class="chat-messages" @scroll="markMessagesAsRead">
          <div v-if="filteredMessages.length === 0" class="no-messages">
            <Icon icon="material-symbols:chat-bubble-outline" width="48" color="var(--el-text-color-placeholder)" />
            <p v-if="activeConversation === 'general'">No messages in team chat yet. Start the conversation!</p>
            <p v-else>No messages with this user yet. Start the conversation!</p>
          </div>
          
          <div v-for="message in filteredMessages" :key="message.id" class="message-container">
            <div 
              :class="[
                'message', 
                message.sender.id === currentUser.id ? 'own-message' : 'other-message'
              ]"
            >
              <el-avatar 
                v-if="message.sender.id !== currentUser.id"
                :size="32" 
                :src="message.sender.avatar"
                class="message-avatar"
              >
                {{ message.sender.name.charAt(0).toUpperCase() }}
              </el-avatar>
              
              <div class="message-content">
                <div v-if="message.sender.id !== currentUser.id" class="message-sender">
                  {{ message.sender.name }}
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTimestamp(message.timestamp) }}</div>
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
  display: flex;
  position: relative;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.conversation-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.unread-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 16px;
}

.unread-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-danger);
  min-width: 16px;
  text-align: center;
}

.online-users-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.online-users-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
}

.online-avatars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.online-avatar {
  border: 2px solid var(--el-bg-color);
  transition: transform 0.2s ease;
}

.online-avatar:hover {
  transform: scale(1.1);
}

.more-users {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.online-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}

/* Users Sidebar */
.users-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color-page);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-content: space-between;
}

.conversation-item > div:first-child {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-item:hover {
  background-color: var(--el-fill-color-light);
}

.conversation-item.active {
  background-color: var(--el-color-primary-light-9);
  border-right: 3px solid var(--el-color-primary);
}

.conversation-item span {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.unread-badge {
  background-color: var(--el-color-danger);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
  white-space: nowrap;
  min-width: 20px;
  text-align: center;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-area.hidden {
  display: none;
}

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
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
  border-radius: 16px 4px 16px 16px;
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

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
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

/* Responsive */
@media (max-width: 768px) {
  .users-sidebar {
    width: 100% !important;
  }
  
  .conversation-title {
    font-size: 14px;
  }
  
  .online-users-btn {
    padding: 4px 8px;
    gap: 4px;
  }
  
  .online-avatars {
    gap: 1px;
  }
  
  .online-avatar {
    width: 18px !important;
    height: 18px !important;
    font-size: 10px;
  }
  
  .online-text {
    font-size: 11px;
    margin-left: 6px;
  }
  
  .more-users {
    font-size: 9px;
  }
}
</style>
