
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
} from "lucide-react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const sidebarNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/dashboard/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
    { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/dashboard/users', label: 'Users', icon: Users },
    { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarHeader>
                 <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <Theater className="h-6 w-6 text-primary" />
                    <span className="duration-200 group-data-[collapsible=icon]:opacity-0">MaskShop Admin</span>
                </Link>
            </SidebarHeader>
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
        </Sidebar>
    );
}
