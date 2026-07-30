import type { AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'

const col = (
  key: string,
  label: string,
  minWidth: number,
  opts?: { hideable?: boolean; visible?: boolean }
): AdjustableColumnSetting => ({
  key,
  label,
  minWidth,
  visible: opts?.visible !== false,
  hideable: opts?.hideable !== false,
})

export const userTableColumnPresets = {
  /**
   * Shared across every user list page (User, AllUsers, County, NewAccounts,
   * AdminUsers, GrmUsers, SuperAdminUsers, SupportUsers) so the default view is
   * identical everywhere: Name, Email, Phone, Last Login — role now shows as an
   * icon beside the name (see UserListAdjustableColumns) rather than its own
   * column. Everything else is defined once here and reachable via the column
   * picker on every page, hidden by default rather than page-specific.
   */
  standard: (): AdjustableColumnSetting[] => [
    col('name', 'Name', 160, { hideable: false }),
    col('email', 'Email', 160),
    col('phone', 'Phone', 120),
    col('last_login', 'Last Login', 130),
    col('username', 'Username', 100, { visible: false }),
    col('country', 'Country', 90, { visible: false }),
    col('organization', 'Organization', 120, { visible: false }),
    col('access_reason', 'Reason for Access', 140, { visible: false }),
    col('county', 'County', 100, { visible: false }),
    col('settlement', 'Settlement', 120, { visible: false }),
  ],
}
