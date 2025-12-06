
'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Tags, 
    ClipboardList,
    Users,
    Settings,
    Theater,
    ChevronLeft,
    ImageIcon,
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
import siteSettings from "@/../appData/siteSettings.json";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/layout/page-loader";

const sidebarNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/dashboard/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/dashboard/categories', label: 'Categories', icon: Tags },
    { href: '/admin/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/dashboard/banners', label: 'Banners', icon: ImageIcon },
    { href: '/admin/dashboard/users', label: 'Users', icon: Users },
];

const settingsNavItem = { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings };


export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const { setOpen } = useSidebar();
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        if (isNavigating) {
            setIsNavigating(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setOpen(false);
        if (pathname !== href) {
            setIsNavigating(true);
            router.push(href);
        }
    };

    return (
        <>
            {isNavigating && <PageLoader />}
            <Sidebar>
                <SidebarHeader>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold" onClick={(e) => handleLinkClick(e, '/admin/dashboard')}>
                        {siteSettings.logoUrl ? (
                            <Image src={siteSettings.logoUrl} alt={siteSettings.siteName} width={24} height={24} className="h-6 w-auto" />
                        ) : (
                            <Theater className="h-6 w-6 text-primary" />
                        )}
                        <span className="duration-200 group-data-[collapsible=icon]:opacity-0">{siteSettings.siteName} Admin</span>
                    </Link>
                    <button 
                        onClick={() => setOpen(false)}
                        className="absolute right-2 top-3 hidden h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:hidden sm:flex">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="sr-only">Collapse Sidebar</span>
                    </button>
                </SidebarHeader>

                {!isLoading && user && (
                    <div className="flex flex-col p-2 group-data-[collapsible=icon]:hidden">
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
                                    <Link href={item.href} onClick={(e) => handleLinkClick(e, item.href)}>
                                        <item.icon />
                                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
                                <Link href={settingsNavItem.href} onClick={(e) => handleLinkClick(e, settingsNavItem.href)}>
                                    <settingsNavItem.icon />
                                    <span className="group-data-[collapsible=icon]:hidden">{settingsNavItem.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </>
    );
}
