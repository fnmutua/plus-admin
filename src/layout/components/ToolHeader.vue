<script lang="tsx">
import { defineComponent, computed, ref } from 'vue'
import { Collapse } from '@/components/Collapse'
// import { LocaleDropdown } from '@/components/LocaleDropdown'
import { SizeDropdown } from '@/components/SizeDropdown'
import { UserInfo } from '@/components/UserInfo'
import { Screenfull } from '@/components/Screenfull'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { NotificationBadge } from '@/components/NotificationBadge'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import AIAssistant from '@/components/AIAssistant'
import Chat from '@/components/Chat'
import { Icon } from '@iconify/vue'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
// const locale = computed(() => appStore.getLocale)

// AI Assistant
const aiAssistantRef = ref()

const openAIAssistant = () => {
  aiAssistantRef.value?.openModal()
}

// Chat
const chatRef = ref()
const unreadChatCount = ref(0)

const openChat = () => {
  console.log('Chat icon clicked!')
  console.log('chatRef.value:', chatRef.value)
  if (chatRef.value) {
    console.log('Calling openModal...')
    chatRef.value.openModal()
  } else {
    console.error('chatRef is null or undefined!')
  }
}

// Listen for unread count updates from chat component
const updateUnreadCount = (count: number) => {
  unreadChatCount.value = count
}

export default defineComponent({
  name: 'ToolHeader',
  components: {
    AIAssistant,
    Chat
  },
  setup() {
    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
          'dark:bg-[var(--el-bg-color)]'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="hover-tigger" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="<md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          <ThemeSwitch/> 

          {screenfull.value ? (
            <Screenfull class="hover-tigger" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {size.value ? (
            <SizeDropdown class="hover-tigger" color="var(--top-header-text-color)"></SizeDropdown>
          ) : undefined}
          <NotificationBadge class="hover-tigger"></NotificationBadge>

          {/* Chat Icon with Badge */}
          <div 
            class="hover-tigger cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--el-fill-color-light)] transition-colors relative"
            onClick={openChat}
            title="Chat"
          >
            <Icon 
              icon="majesticons:chat-2-line"
              size="32" 
              color="var(--top-header-text-color)"
            />
            {unreadChatCount.value > 0 && (
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                {unreadChatCount.value > 99 ? '99+' : unreadChatCount.value}
              </span>
            )}
          </div>

          {/* AI Assistant Icon */}
          <div 
            class="hover-tigger cursor-pointer flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--el-fill-color-light)] transition-colors"
            onClick={openAIAssistant}
            title="AI Assistant"
          >
            <Icon 
              icon="hugeicons:ai-brain-02" 
              width="18" 
              color="var(--top-header-text-color)"
            />
          </div>

          <UserInfo class="hover-tigger"></UserInfo>
        </div>

        {/* Chat Modal */}
        <Chat ref={chatRef} onUpdateUnreadCount={updateUnreadCount} />

        {/* AI Assistant Modal */}
        <AIAssistant ref={aiAssistantRef} />
      </div>
    )
  }
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-tool-header';

.@{prefix-cls} {
  transition: left var(--transition-time-02);
}
</style>
