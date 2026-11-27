/**
 * @eduplatform/ui: components shared by the web app and the admin console.
 * Styles: import '@eduplatform/ui/styles.css' once in each app's globals.css.
 */
export { cn } from './lib/cn';

// Building blocks
export {
  ActionForm,
  useActionFormPending,
  type ActionFormProps,
  type FormState,
} from './components/action-form';
export { Alert } from './components/alert';
export { Drawer, type DrawerProps } from './components/drawer';
export {
  AlertHost,
  confirmDialog,
  notify,
  showAlert,
  type AlertIcon,
  type AlertOptions,
  type NotifyVariant,
} from './components/alerts';
export { Badge, type BadgeProps } from './components/badge';
export { Button, buttonVariants, type ButtonProps } from './components/button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/card';
export { EmptyState, type EmptyStateProps } from './components/empty-state';
export { Checkbox, Field, FileInput, Input, Label, Select } from './components/form';
export {
  PermissionGrid,
  type PermissionGridProps,
  type PermissionResource,
} from './components/permission-grid';
export {
  ResetPasswordButton,
  type ResetPasswordButtonProps,
  type ResetPasswordResult,
} from './components/reset-password-button';
export { Table, TableHead, Td, Th } from './components/table';

// Page frame
export { AppShell, type AppShellProps, type NavItem, type NavSection } from './shell/app-shell';
export { PageHeader, type PageHeaderProps } from './shell/page-header';
export { UserBadge, type UserBadgeProps } from './shell/user-badge';
