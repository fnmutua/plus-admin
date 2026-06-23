import { setCssVar } from '@/utils'

/** Element Plus global size tokens — applied to :root so the size picker affects the whole app. */
const SIZE_CSS_VARS: Record<ElememtPlusSize, Record<string, string>> = {
  small: {
    '--el-font-size-base': '12px',
    '--el-font-size-small': '11px',
    '--el-font-size-large': '13px',
    '--el-font-size-extra-large': '14px',
    '--el-component-size': '24px'
  },
  default: {
    '--el-font-size-base': '14px',
    '--el-font-size-small': '12px',
    '--el-font-size-large': '16px',
    '--el-font-size-extra-large': '18px',
    '--el-component-size': '32px'
  },
  large: {
    '--el-font-size-base': '16px',
    '--el-font-size-small': '14px',
    '--el-font-size-large': '18px',
    '--el-font-size-extra-large': '20px',
    '--el-component-size': '40px'
  }
}

export function applyElementPlusSize(size: ElememtPlusSize = 'default') {
  const vars = SIZE_CSS_VARS[size] ?? SIZE_CSS_VARS.default
  for (const [prop, value] of Object.entries(vars)) {
    setCssVar(prop, value)
  }
  document.documentElement.dataset.elementPlusSize = size
}
