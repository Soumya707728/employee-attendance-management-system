
import Link from 'next/link';

export default function sidebar() {
    return (
        <div className="w-64 h-screen bg-gradient-to-b from-gray-500 to-gray-800 shadow-2xl flex flex-col fixed border-r border-gray-700">

      
      <div className="p-6 text-xl font-bold border-b border-gray-700 text-white flex items-center gap-3">
        <span className="text-2xl">👨‍💼</span>
        <span>Employee Panel</span>
      </div>
                
        <nav className="flex-1 p-4 space-y-2">
            <Link href="/dashboard" className="block py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200 text-gray-100 hover:text-white font-semibold flex items-center gap-3">
                <span className="text-lg
                ">📊</span>
                Dashboard
            </Link>
            <Link href="/profile" className="block py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200 text-gray-100 hover:text-white font-semibold flex items-center gap-3">
                <span className="text-lg">👤</span>
                My Profile
            </Link>
            <Link href="/attendance" className="block py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200 text-gray-100 hover:text-white font-semibold flex items-center gap-3">
                <span className="text-lg">📅</span>
                Attendance
            </Link>
            <Link href="/export" className="block py-3 px-4 rounded-lg hover:bg-gray-700 transition duration-200 text-gray-100 hover:text-white font-semibold flex items-center gap-3"> 
                <span className="text-lg">📥</span>
                Export Data
            </Link>
        </nav>

                <div className="p-4 border-t border-gray-700">
                    <Link
                        href="/login"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 font-semibold hover:bg-red-600 transition duration-200 text-gray-100 hover:text-white bg-red-500/10"
                    >
                        <svg
                            aria-hidden="true"        
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                            <path d="M21 3v18" />
                        </svg>
                        <span>Logout</span>
                    </Link>
                </div>
      </div>
    )
}