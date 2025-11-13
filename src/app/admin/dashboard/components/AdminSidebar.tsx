
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Tags, 
    ClipboardList,
    MessageSquare,
    Ticket,
    Users,
    BadgePercent,
    Theater,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

const sidebarNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/dashboard/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
    { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/dashboard/coupons', label: 'Coupons', icon: Ticket },
    { href: '/admin/dashboard/users', label: 'Users', icon: Users },
    { href: '/admin/dashboard/affiliates', label: 'Affiliates', icon: BadgePercent },
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
                <SidebarTrigger className="hidden md:flex" />
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
            <SidebarFooter>
                {/* Optional footer content */}
            </SidebarFooter>
        </Sidebar>
    );
}
