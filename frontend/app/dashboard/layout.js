
import Sidebar from "../components/sidebar";
export default function dashboardlayout({ children }) {
    return(
        <div className="flex">
            <Sidebar />
            <main className="ml-64 h-screen w-screen overflow-y-auto p-6 ">
                {children}
            </main>
        </div>
    );
}