import Sidebar from "@/app/components/sidebar";
export default function ProfileLayout({ children }) {
    return(
        <div className="flex">
            <Sidebar />
            <main className="ml-64 h-screen w-screen overflow-y-auto p-6 ">
                {children}
            </main>
        </div>
    );
}