
// This layout is intentionally left blank. 
// It isolates the admin section from the public site's root layout.
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
