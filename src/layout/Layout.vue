<script lang="tsx">
import { computed, defineComponent, unref } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { Backtop } from '@/components/Backtop'
import { Setting } from '@/components/Setting'
import { useRenderLayout } from './components/useRenderLayout'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('layout')

const appStore = useAppStore()

// 是否是移动端
const mobile = computed(() => appStore.getMobile)

// 菜单折叠
const collapse = computed(() => appStore.getCollapse)

const layout = computed(() => appStore.getLayout)

const handleClickOutside = () => {
  appStore.setCollapse(true)
}

const renderLayout = () => {
  switch (unref(layout)) {
    case 'classic':
      const { renderClassic } = useRenderLayout()
      return renderClassic()
    case 'topLeft':
      const { renderTopLeft } = useRenderLayout()
      return renderTopLeft()
    case 'top':
      const { renderTop } = useRenderLayout()
      return renderTop()
    case 'cutMenu':
      const { renderCutMenu } = useRenderLayout()
      return renderCutMenu()
    default:
      break
  }
}

export default defineComponent({
  name: 'Layout',
  setup() {
    return () => (
      <section class={[prefixCls, `${prefixCls}__${layout.value}`, 'w-[100%] h-[100%] relative']}>
        {mobile.value && !collapse.value ? (
          <div
            class="absolute top-0 left-0 w-full h-full opacity-30 z-99 bg-[var(--el-color-black)]"
            onClick={handleClickOutside}
          ></div>
        ) : undefined}

        {renderLayout()}

        <Backtop></Backtop>

        {/* <Setting></Setting> */}
      </section>
    )
  }
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-layout';

// /* Customize the el-scrollbar's draggable part (thumb) */
// :deep(.el-scrollbar__thumb) {
//   background-color: red;  /* Set the scrollbar thumb (draggable part) color to red */
//   border-radius: 10px;  /* Optional: round the thumb edges */
// }

// /* Customize the el-scrollbar track (the area where the thumb slides) */
// :deep(.el-scrollbar__track) {
//   background-color: #f1f1f1;  /* Optional: light color for the track */
//   border-radius: 10px;  /* Optional: round the track edges */
// }

/* Customize el-scrollbar bar (background of the scrollbar) */
:deep(.el-scrollbar__bar) {
  width: 12px;  /* Make scrollbar thicker */
  height: 100% !important; /* Ensure scrollbar takes up the full height */
}

/* Add hover effect for the thumb */
// :deep(.el-scrollbar__thumb:hover) {
//   background-color: darkred; /* Darker thumb color on hover */
// }
</style>
