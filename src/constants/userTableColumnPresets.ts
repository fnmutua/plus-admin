import type { AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'

const col = (
  key: string,
  label: string,
  width: number,
  opts?: { minWidth?: number; hideable?: boolean; visible?: boolean }
): AdjustableColumnSetting => ({
  key,
  label,
  width,
  minWidth: opts?.minWidth,
  visible: opts?.visible !== false,
  hideable: opts?.hideable !== false,
})

export const userTableColumnPresets = {
  /** User.vue, AllUsers.vue */
  full: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('country', 'Country', 120, { minWidth: 90 }),
    col('organization', 'Organization', 180, { minWidth: 120 }),
    col('access_reason', 'Reason for Access', 180, { minWidth: 140 }),
    col('county', 'County', 140, { minWidth: 100 }),
    col('last_login', 'Last Login', 180, { minWidth: 130 }),
  ],

  /** NewAccounts.vue */
  newAccounts: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('country', 'Country', 120, { minWidth: 90 }),
    col('county', 'County', 140, { minWidth: 100 }),
    col('organization', 'Organization', 180, { minWidth: 120 }),
    col('access_reason', 'Reason for Access', 180, { minWidth: 140 }),
  ],

  /** County.vue, SupportUsers.vue */
  minimal: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('county', 'County', 140, { minWidth: 100 }),
  ],

  /** AdminUsers national + county tabs */
  adminExtended: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('country', 'Country', 120, { minWidth: 90 }),
    col('county', 'County', 140, { minWidth: 100 }),
    col('organization', 'Organization', 180, { minWidth: 120 }),
    col('last_login', 'Last Login', 180, { minWidth: 130 }),
  ],

  /** AdminUsers settlement tab */
  adminSettlement: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('settlement', 'Settlement', 180, { minWidth: 120 }),
    col('organization', 'Organization', 180, { minWidth: 120 }),
    col('last_login', 'Last Login', 180, { minWidth: 130 }),
  ],

  /** GrmUsers national + county tabs */
  grmExtended: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('county', 'County', 140, { minWidth: 100 }),
    col('last_login', 'Last Login', 180, { minWidth: 130 }),
  ],

  /** GrmUsers settlement tab */
  grmSettlement: (): AdjustableColumnSetting[] => [
    col('avatar', 'Avatar', 56, { minWidth: 48 }),
    col('name', 'Name', 280, { minWidth: 160, hideable: false }),
    col('username', 'Username', 140, { minWidth: 100 }),
    col('settlement', 'Settlement', 180, { minWidth: 120 }),
    col('last_login', 'Last Login', 180, { minWidth: 130 }),
  ],
}
