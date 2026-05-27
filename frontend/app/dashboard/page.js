"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployees, deleteEmployee } from "../services/api";
import AddEmployee from "../components/addEmployee";
import EditEmployee from "../components/editEmployee";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const router = useRouter();

  const fetchEmployees = async (token) => {
    if (!token) {
      throw new Error("Unauthorized");
    }

    return getEmployees(token);
  };

  useEffect(() => {
    let cancelled = false;

    const loadEmployees = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await fetchEmployees(token);
        if (!cancelled) {
          setEmployees(data);
        }
      } catch (error) {
        if (error.message === "Unauthorized" || error.message === "Invalid token") {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        alert(error.message || "Failed to load employees");
      }
    };

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const openAddForm = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setShowAddForm(true);
  };

  const refreshAfterAdd = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const data = await fetchEmployees(token);
    setEmployees(data);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    await deleteEmployee(id, token);
    const data = await fetchEmployees(token);
    setEmployees(data);
  };

  const getImageSrc = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `${API_URL}${value}`;
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Employees Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and view all employees</p>
        </div>

        <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
         onClick={openAddForm}>
          <span>➕</span> Add Employee
        </button>
      </div>

      {showAddForm && (
        <AddEmployee
          close={() => setShowAddForm(false)}
          refresh={refreshAfterAdd}
        />
      )}

      {editingEmployee && (
        <EditEmployee
          employee={editingEmployee}
          close={() => setEditingEmployee(null)}
          refresh={refreshAfterAdd}
        />
      )}

      {/* Employees Table */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
              <tr className="text-left text-sm font-semibold text-white">
                <th className="p-4">Photo</th>
                <th className="p-4">Employee Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Role</th>
                <th className="p-4">Salary</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-blue-50 transition duration-200">
                  <td className="p-4">
                    {emp.image_url ? (
                      <Image
                        src={getImageSrc(emp.image_url)}
                        alt={emp.name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 shadow"
                        width={48}
                        height={48}
                        unoptimized
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-gray-200 flex items-center justify-center text-sm font-bold text-white shadow">
                        {(emp.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>

                  <td className="p-4 font-semibold text-gray-800">
                    {emp.name}
                  </td>

                  <td className="p-4 text-gray-600">
                    {emp.email}
                  </td>

                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {emp.role}
                    </span>
                  </td>

                  <td className="p-4 font-semibold text-gray-800">₹{emp.salary.toLocaleString()}</td>
                  <td className="p-4 flex gap-3">
                    <button className="bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg transition duration-200 font-semibold" onClick={() => setEditingEmployee(emp)}>
                      ✎ Edit
                    </button>

                    <button className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg transition duration-200 font-semibold" 
                     onClick={() => handleDelete(emp.id)}>
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}