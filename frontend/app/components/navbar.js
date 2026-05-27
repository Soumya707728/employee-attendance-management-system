import React from "react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 w-full bg-transparent shadow-none px-8 py-4 flex items-center justify-between">
      
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img src="/assets/logo.png" alt="Logo" className="w-8 h-8" />
        {/* <span className="text-xl font-bold text-gray-800">Employee Management</span> */}
      </div>

      <div className="ml-auto flex items-center gap-8">
        {/* Menu */}
        <ul className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
          <li className="hover:text-black cursor-pointer">Home </li>
          <li className="hover:text-black cursor-pointer">Contact </li>
        </ul>

        {/* Login Button */}
        <div>
          <button className="flex items-center gap-2 px-6 py-2 rounded-full text-white font-medium 
            bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition">
            Login
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

    </nav>
  );
}