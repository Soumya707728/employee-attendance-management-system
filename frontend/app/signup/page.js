"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { registerUser } from "../services/api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      alert("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({ username, email, password });
      alert("Signup successful. Please login.");
      router.push("/login");
    } catch (error) {
      alert(error.message || "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <div className="w-full max-w-[420px] p-10 rounded-3xl bg-gray-200 shadow-[10px_10px_25px_#b8b9be,-10px_-10px_25px_#ffffff]">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-200 shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff]">
            👤
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-gray-700">
          Employee Signup
        </h2>

        <p className="text-center text-sm text-gray-500 mb-6">
          Create your account to access the management system
        </p>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 rounded-xl mb-4 bg-gray-200 outline-none shadow-inner"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-xl mb-4 bg-gray-200 outline-none shadow-inner"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-xl mb-4 bg-gray-200 outline-none shadow-inner"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm password"
          className="w-full p-3 rounded-xl mb-5 bg-gray-200 outline-none shadow-inner"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleSignup}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gray-200 font-semibold text-gray-700 shadow-[5px_5px_10px_#b8b9be,-5px_-5px_10px_#ffffff] disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-sm text-gray-600 mt-5">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-gray-800 underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
