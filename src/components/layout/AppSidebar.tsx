import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  ShoppingCart, 
  ClipboardList,
  Wrench,
  Package,
  Settings,
  Building2,
  BarChart3,
  Wallet,
  CalendarCheck,
  ReceiptText,
  Star,
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { toast } from "sonner";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Rooms", url: "/rooms", icon: BedDouble, permission: "rooms.view" },
  { title: "Reservations", url: "/reservations", icon: CalendarCheck, permission: "bookings.view" },
  { title: "Guests", url: "/guests", icon: Users, permission: "guests.view" },
  { title: "Point of Sale", url: "/pos", icon: ShoppingCart, permission: "pos.view" },
];

const operationsItems: NavItem[] = [
  { title: "Housekeeping", url: "/housekeeping", icon: ClipboardList, permission: "housekeeping.view" },
  { title: "Maintenance", url: "/maintenance", icon: Wrench, permission: "maintenance.view" },
  { title: "Inventory", url: "/inventory", icon: Package, permission: "inventory.view" },
  { title: "Reports", url: "/reports", icon: BarChart3, permission: "reports.view" },
  { title: "Finance", url: "/finance", icon: Wallet, permission: "finance.view" },
  { title: "Refunds", url: "/refunds", icon: ReceiptText, permission: "refunds.view" },
  { title: "Reviews", url: "/reviews", icon: Star },
];

const settingsItems: NavItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings.view" },
];

export function AppSidebar() {
  const { hasPermission, signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  // Filter items based on permissions
  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      // If no permission required, show to all
      if (!item.permission) return true;
      // Check if user has the permission
      return hasPermission(item.permission);
    });
  };

  const visibleMainItems = filterItems(mainNavItems);
  const visibleOperationsItems = filterItems(operationsItems);
  const visibleSettingsItems = filterItems(settingsItems);

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Building2 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground text-base">STROS</h1>
            <p className="text-xs text-sidebar-foreground/60">Property Manager</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-3 mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleOperationsItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-3 mb-2">
              Operations
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOperationsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          {visibleSettingsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
