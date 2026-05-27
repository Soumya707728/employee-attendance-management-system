"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addEmployee } from "../services/api";

export default function AddEmployee({ close, refresh }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    salary: ""
  });

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setIsSubmitting(true);

      await addEmployee(
        {
          ...form,
          salary: Number(form.salary),
        },
        token
      );

      await refresh();
      close();
    } catch (error) {
      if (error.message === "Unauthorized" || error.message === "Invalid token") {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      alert(error.message || "Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          ➕ Add New Employee
        </h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            placeholder="Employee full name"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
          />
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            placeholder="employee@example.com"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
          />
        </div>
        
        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
          <input
            placeholder="e.g. Manager, Developer, HR"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            value={form.role}
            onChange={(e) => onChange("role", e.target.value)}
            required
          />
        </div>
        
        {/* Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Salary (₹)</label>
          <input
            placeholder="50000"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            type="number"
            min="0"
            step="1"
            value={form.salary}
            onChange={(e) => onChange("salary", e.target.value)}
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={close}
            className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition duration-300 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "✓ Add Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
