/**
 * @eduplatform/ui: components shared by the web app and the admin console.
 * Styles: import '@eduplatform/ui/styles.css' once in each app's globals.css.
 */
export { cn } from './lib/cn';

// Building blocks
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
export { Input, Label } from './components/form';

// Page frame
export { AppShell, type AppShellProps, type NavItem, type NavSection } from './shell/app-shell';
export { PageHeader, type PageHeaderProps } from './shell/page-header';
export { UserBadge, type UserBadgeProps } from './shell/user-badge';
