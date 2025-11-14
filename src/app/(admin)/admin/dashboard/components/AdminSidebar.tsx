
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Tags, 
    ClipboardList,
    Users,
    Settings,
    Theater,
    ChevronLeft,
} from "lucide-react";
import { 
    Sidebar, 
    SidebarHeader, 
    SidebarContent, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    useSidebar,
    SidebarFooter
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const sidebarNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/dashboard/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
    { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/dashboard/users', label: 'Users', icon: Users },
];

const settingsNavItem = { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings };


export function AdminSidebar() {
    const pathname = usePathname();
    const { user, isLoading } = useAuth();
    const { state, setOpen } = useSidebar();

    const isCollapsed = state === 'collapsed';

    return (
        <Sidebar>
            <SidebarHeader>
                 <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <Theater className="h-6 w-6 text-primary" />
                    <span className="duration-200 group-data-[collapsible=icon]:opacity-0">MaskShop Admin</span>
                </Link>
                <button 
                    onClick={() => setOpen(false)}
                    className="absolute right-2 top-3 hidden h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:hidden sm:flex">
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Collapse Sidebar</span>
                </button>
            </SidebarHeader>

            {!isCollapsed && !isLoading && user && (
                 <div className="flex flex-col p-2">
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL ?? undefined} alt={`@${user.displayName}`} />
                            <AvatarFallback>{user.displayName?.[0] ?? 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-0.5 text-xs">
                            <p className="font-medium text-foreground">{user.displayName}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <Separator className="my-1"/>
            
            <SidebarContent>
                <SidebarMenu>
                    {sidebarNavItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                             <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                                tooltip={{children: item.label}}
                                >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <Separator className="my-1"/>

            <SidebarFooter>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === settingsNavItem.href}
                            tooltip={{ children: settingsNavItem.label }}
                        >
                            <Link href={settingsNavItem.href}>
                                <settingsNavItem.icon />
                                <span>{settingsNavItem.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
