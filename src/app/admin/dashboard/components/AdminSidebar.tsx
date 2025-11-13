
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
        <aside className="w-64 border-r bg-background flex flex-col">
            <div className="h-16 border-b flex items-center px-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <Theater className="h-6 w-6 text-primary" />
                    <span>MaskShop Admin</span>
                </Link>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {sidebarNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted",
                            pathname === item.href && "bg-muted text-primary"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
