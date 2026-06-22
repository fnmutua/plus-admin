<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { ElButton, ElInput, ElDrawer, ElAvatar, ElAlert, ElTooltip } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { handleSessionExpired } from '@/config/axios/service'

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
const activeConversation = ref<string | null>(null) // user ID for direct messages
const connectionError = ref<string | null>(null)
const isReconnecting = ref(false)

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
let reconnectAttempts = 0
const maxReconnectAttempts = 10
let reconnectTimeout: NodeJS.Timeout | null = null

const connectWebSocket = () => {
  try {
    // Use environment variable for WebSocket URL, fallback to localhost for development
    const wsUrl = import.meta.env.VITE_CHAT_WS_URL || 
                  (window.location.protocol === 'https:' ? 'wss://kesmis.go.ke/chat' : 'ws://localhost:3001/chat')
    console.log('Connecting to WebSocket:', wsUrl)
    
    // Close existing connection if any
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close()
    }
    
    isReconnecting.value = reconnectAttempts > 0
    connectionError.value = null
    
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected')
      isConnected.value = true
      reconnectAttempts = 0 // Reset reconnect attempts on successful connection
      isReconnecting.value = false
      connectionError.value = null
      
      // Clear any pending reconnect timeout
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      
      // Send join message
      ws?.send(JSON.stringify({
        type: 'join',
        user: currentUser.value
      }))
      
      // Request initial message history when a conversation is selected
      // Will be requested when user selects a conversation
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason)
      isConnected.value = false
      
      // Set error message based on close code
      if (event.code === 1006) {
        connectionError.value = 'Connection failed. Please ensure the chat server is running.'
      } else if (event.code === 1000) {
        // Normal closure, no error
        connectionError.value = null
      } else {
        connectionError.value = `Connection closed (code: ${event.code})`
      }
      
      // Only attempt to reconnect if we haven't exceeded max attempts
      // Don't reconnect if it was a normal closure (code 1000) or if we're unmounting
      if (reconnectAttempts < maxReconnectAttempts && event.code !== 1000) {
        reconnectAttempts++
        isReconnecting.value = true
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, etc., max 30s
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000)
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
        
        reconnectTimeout = setTimeout(() => {
          connectWebSocket()
        }, delay)
      } else if (reconnectAttempts >= maxReconnectAttempts) {
        isReconnecting.value = false
        connectionError.value = 'Failed to connect after multiple attempts. Please check if the chat server is running and refresh the page.'
        console.error('Max reconnection attempts reached. Please refresh the page.')
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
      connectionError.value = 'Connection error. Please check if the chat server is running.'
    }
  } catch (error) {
    console.error('Failed to connect to WebSocket:', error)
    isConnected.value = false
    connectionError.value = 'Failed to establish connection. Please check your network and server status.'
  }
}

// Manual reconnect function
const manualReconnect = () => {
  reconnectAttempts = 0
  isReconnecting.value = false
  connectionError.value = null
  connectWebSocket()
}

// Handle incoming WebSocket messages
const handleWebSocketMessage = (data: any) => {
  switch (data.type) {
    case 'message':
      if (data.message) {
        // Parse timestamp properly - handle string, Date object, or number
        let timestamp: Date
        if (data.message.timestamp) {
          if (data.message.timestamp instanceof Date) {
            timestamp = data.message.timestamp
          } else if (typeof data.message.timestamp === 'string') {
            timestamp = new Date(data.message.timestamp)
          } else if (typeof data.message.timestamp === 'number') {
            timestamp = new Date(data.message.timestamp)
          } else {
            timestamp = new Date()
          }
        } else {
          timestamp = new Date()
        }
        
        // Validate timestamp
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp received, using current time:', data.message.timestamp)
          timestamp = new Date()
        }
        
        const message = {
          id: data.message.id || Date.now(),
          content: data.message.content,
          sender: data.message.sender,
          timestamp: timestamp,
          receiver_id: data.message.receiver_id,
          isRead: false // Mark new messages as unread
        }
        
        console.log('Received message:', message, 'Original timestamp:', data.message.timestamp)
        
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
        const formattedMessages = data.messages.map((msg: any) => {
          // Parse timestamp properly
          let timestamp: Date
          if (msg.timestamp) {
            if (msg.timestamp instanceof Date) {
              timestamp = msg.timestamp
            } else if (typeof msg.timestamp === 'string') {
              timestamp = new Date(msg.timestamp)
            } else if (typeof msg.timestamp === 'number') {
              timestamp = new Date(msg.timestamp)
            } else {
              timestamp = new Date()
            }
          } else {
            timestamp = new Date()
          }
          
          // Validate timestamp
          if (isNaN(timestamp.getTime())) {
            console.warn('Invalid timestamp in message history:', msg.timestamp)
            timestamp = new Date()
          }
          
          return {
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: timestamp,
            receiver_id: msg.receiver_id
          }
        })
        
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
        const formattedMessages = data.messages.map((msg: any) => {
          // Parse timestamp properly
          let timestamp: Date
          if (msg.timestamp) {
            if (msg.timestamp instanceof Date) {
              timestamp = msg.timestamp
            } else if (typeof msg.timestamp === 'string') {
              timestamp = new Date(msg.timestamp)
            } else if (typeof msg.timestamp === 'number') {
              timestamp = new Date(msg.timestamp)
            } else {
              timestamp = new Date()
            }
          } else {
            timestamp = new Date()
          }
          
          // Validate timestamp
          if (isNaN(timestamp.getTime())) {
            console.warn('Invalid timestamp in conversation messages:', msg.timestamp)
            timestamp = new Date()
          }
          
          return {
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: timestamp,
            receiver_id: msg.receiver_id,
            isRead: true // Mark existing conversation messages as read
          }
        })
        
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

    case 'session_terminated':
      visible.value = false
      if (ws) {
        ws.close()
        ws = null
      }
      isConnected.value = false
      handleSessionExpired(data.message || 'You have been logged out by an administrator.')
      break
      
    case 'message_read':
      // Message was read by recipient - update message status
      if (data.messageId) {
        const message = chatMessages.value.find(msg => msg.id === data.messageId)
        if (message) {
          message.isRead = true
          console.log('Message marked as read:', data.messageId)
        }
      }
      break
      
    case 'error':
      console.error('WebSocket error from server:', data.message)
      // Could show a user-friendly error message here
      break
  }
}

// Send message
const sendMessage = () => {
  if (!currentMessage.value.trim() || !activeConversation.value) return
  
  const message = {
    content: currentMessage.value,
    sender: currentUser.value,
    receiver_id: activeConversation.value,
    timestamp: new Date()
  }
  
  // Clear input immediately
  currentMessage.value = ''
  
  // Send to server - don't add locally, wait for server response
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      message: message,
      to: activeConversation.value
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
  if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else {
    return 'Unknown'
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp:', timestamp)
    return 'Unknown'
  }
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  } catch (error) {
    console.error('Error formatting timestamp:', error, timestamp)
    return 'Unknown'
  }
}

// Open chat modal
const openModal = () => {
  visible.value = true
  
  // If no conversation is selected, show users sidebar
  if (!activeConversation.value) {
    showUsersSidebar.value = true
  }
  
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
  if (activeConversation.value) {
    markMessagesAsRead()
    
    // Request message history when chat opens if a conversation is selected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'get_messages',
        conversation: activeConversation.value,
        user_id: currentUser.value.id
      }))
    }
    
    nextTick(() => {
      scrollToBottom()
    })
  }
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
  if (!visible.value || !activeConversation.value) return // Only mark as read when chat is open and conversation is selected
  
  let hasChanges = false
  const messagesToMarkRead: any[] = []
  
  chatMessages.value.forEach(msg => {
    if (msg.sender.id !== currentUser.value.id && !msg.isRead) {
      // For direct messages, mark messages between these users as read
      if ((msg.sender.id === activeConversation.value && msg.receiver_id === currentUser.value.id) ||
          (msg.sender.id === currentUser.value.id && msg.receiver_id === activeConversation.value)) {
        msg.isRead = true
        hasChanges = true
        messagesToMarkRead.push(msg.id)
      }
    }
  })
  
  // Notify server about read messages
  if (messagesToMarkRead.length > 0 && ws && ws.readyState === WebSocket.OPEN) {
    const websocket = ws // Store reference to avoid null check issues
    messagesToMarkRead.forEach(messageId => {
      websocket.send(JSON.stringify({
        type: 'message_read',
        messageId: messageId,
        readBy: currentUser.value.id
      }))
    })
  }
  
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
      conversation: conversationId,
      user_id: currentUser.value.id
    }))
  }
  
  nextTick(() => {
    scrollToBottom()
  })
}

// Update badge count
const updateBadgeCount = () => {
  // Only count unread direct messages from others
  const totalUnreadCount = chatMessages.value.filter(msg => 
    msg.sender.id !== currentUser.value.id && 
    !msg.isRead &&
    msg.receiver_id === currentUser.value.id // Only direct messages to current user
  ).length
  
  unreadCount.value = totalUnreadCount
  emit('updateUnreadCount', totalUnreadCount)
}

// Filtered messages for active conversation
const filteredMessages = computed(() => {
  if (!activeConversation.value) {
    return []
  }
  // Direct messages: show messages between these two users
  return chatMessages.value.filter(msg => 
    (msg.sender.id === activeConversation.value && msg.receiver_id === currentUser.value.id) ||
    (msg.sender.id === currentUser.value.id && msg.receiver_id === activeConversation.value)
  )
})

// Mobile responsive
const isMobile = computed(() => appStore.getMobile || window.innerWidth <= 768)
const drawerSize = computed(() => isMobile.value ? '100%' : '25%')

// Active conversation info
const activeConversationInfo = computed(() => {
  if (!activeConversation.value) {
    return {
      title: 'Select a user to chat',
      subtitle: `${onlineUsers.value.length} online`,
      icon: 'material-symbols:person'
    }
  }
  const user = onlineUsers.value.find(u => u.id === activeConversation.value)
  return {
    title: user?.name || 'Direct Message',
    subtitle: 'online',
    icon: 'material-symbols:person'
  }
})

// Lifecycle
onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  // Clear reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  
  // Close WebSocket connection
  if (ws) {
    ws.close(1000, 'Component unmounting') // Normal closure
    ws = null
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
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  
  if (newVisible) {
    // Send drawer state to server with current conversation
    ws.send(JSON.stringify({
      type: 'drawer_state',
      isOpen: true,
      conversationId: activeConversation.value || null
    }));
  } else {
    // Send drawer closed state
    ws.send(JSON.stringify({
      type: 'drawer_state',
      isOpen: false
    }));
  }
});

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
          <el-tooltip 
            v-if="!isConnected && isReconnecting" 
            :content="`Reconnecting... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`" 
            placement="bottom"
          >
            <Icon icon="material-symbols:sync" width="16" color="#e6a23c" class="rotating" />
          </el-tooltip>
          <el-tooltip 
            v-else-if="!isConnected" 
            :content="connectionError || 'Disconnected'" 
            placement="bottom"
          >
            <Icon icon="material-symbols:wifi-off" width="16" color="#f56c6c" />
          </el-tooltip>
          <el-tooltip v-else content="Connected" placement="bottom">
            <Icon icon="material-symbols:wifi" width="16" color="#67c23a" />
          </el-tooltip>
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
        <!-- Connection Error Banner -->
        <div v-if="connectionError && !isReconnecting" class="connection-error-banner">
          <el-alert
            :title="connectionError"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="error-actions">
                <el-button size="small" type="primary" @click="manualReconnect">
                  Retry Connection
                </el-button>
              </div>
            </template>
          </el-alert>
        </div>
        
        <!-- Reconnecting Banner -->
        <div v-if="isReconnecting" class="connection-status-banner">
          <el-alert
            :title="`Reconnecting... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
        
        <!-- Messages -->
        <div ref="chatContainer" class="chat-messages" @scroll="markMessagesAsRead">
          <div v-if="!activeConversation" class="no-messages">
            <Icon icon="material-symbols:chat-bubble-outline" width="48" color="var(--el-text-color-placeholder)" />
            <p>Select a user from the sidebar to start chatting</p>
          </div>
          <div v-else-if="filteredMessages.length === 0" class="no-messages">
            <Icon icon="material-symbols:chat-bubble-outline" width="48" color="var(--el-text-color-placeholder)" />
            <p>No messages with this user yet. Start the conversation!</p>
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
                <div class="message-time">
                  {{ formatTimestamp(message.timestamp) }}
                  <span v-if="message.sender.id === currentUser.id" class="message-status">
                    <Icon 
                      v-if="message.isRead" 
                      icon="material-symbols:done-all" 
                      width="16" 
                      color="#409eff" 
                      class="status-icon read"
                    />
                    <Icon 
                      v-else 
                      icon="material-symbols:done-all" 
                      width="16" 
                      color="#909399" 
                      class="status-icon"
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
              :disabled="!currentMessage.trim() || !activeConversation"
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon.read {
  color: #409eff !important;
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

/* Connection Status Banners */
.connection-error-banner,
.connection-status-banner {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.error-actions {
  margin-top: 8px;
}

/* Rotating animation for reconnecting icon */
.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
