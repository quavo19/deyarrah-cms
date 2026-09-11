import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Package,
  FolderTree,
  Warehouse,
  Clock,
  ClipboardList,
  Mail
} from "lucide-react"

export const routes = [
  // {
  //   title: "Dashboard",
  //   icon: LayoutDashboard,
  //   path: "/dashboard",
  //   roles: ["SUPER_ADMIN"],
  // },
  {
    title: "Users",
    icon: Users,
    path: "/users",
    roles: [ "SUPER_ADMIN"],
  },
  // {
  //   title: "Contacts",
  //   icon: Mail,
  //   path: "/contacts",
  //   roles: ["ADMIN", "SUPER_ADMIN"],
  // },

  {
    title: "Inventory",
    icon: Package,
    path: "/inventory",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Categories",
    icon: FolderTree,
    path: "/categories",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Spaces",
    icon: Warehouse,
    path: "/spaces",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Orders",
    icon: ClipboardList,
    path: "/orders",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Support",
    icon: Mail,
    path: "/support",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "My Orders",
    icon: ClipboardList,
    path: "/my-orders",
    roles: ["STAFF"],
  },
  {
    title: "Downtimes",
    icon: Clock,
    path: "/downtimes",
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
    roles: ["ADMIN", "SUPER_ADMIN","STAFF"],
  },
]
