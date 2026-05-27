"use client"

import { useState } from "react"
import { loginUser } from "../services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";



export default function login() {
    const[username, setUsername] =useState("");
    const[password, setPassword] =useState("");
    const router = useRouter();

  const handleLogin = async () => {
    try {
      const data = await loginUser({ username, password });

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role || "employee");
        localStorage.setItem("username", data.username || username);
        router.push("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (error) {
      alert(error.message || "Login failed");
    }
  };
    
  return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200">

      <div className="w-[380px] p-10 rounded-3xl bg-gray-200 shadow-[10px_10px_25px_#b8b9be,-10px_-10px_25px_#ffffff]">

        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-200 shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff]">
            👤
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-gray-700">
          Welcome to Employee Management System
        </h2>

        <p className="text-center text-sm text-gray-500 mb-6">
          Please login to continue
        </p>

        <input
          type="text"
          placeholder="username"
          className="w-full p-3 rounded-xl mb-4 bg-gray-200 outline-none shadow-inner"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl mb-4 bg-gray-200 outline-none shadow-inner"
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-between text-sm text-gray-500 mb-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            Remember me
          </label>

          <span className="cursor-pointer">Forgot password?</span>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-gray-200 font-semibold text-gray-700 shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff]"
        >
          LogIn
        </button>

        <p className="text-center text-sm text-gray-600 mt-5">
          New employee?{" "}
          <Link href="/signup" className="font-semibold text-gray-800 underline">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
}

