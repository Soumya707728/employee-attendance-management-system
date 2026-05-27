"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadAttendanceExport, getAttendanceExportPreview, getEmployees } from "../services/api";

export default function Export() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    role: "All",
    employeeId: "",
    format: "csv",
  });
  const [employees, setEmployees] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        const rows = await getAttendanceExportPreview(filters, token);
        if (!cancelled) {
          setPreviewRows(rows);
        }
      } catch (error) {
        if (error.message === "Unauthorized" || error.message === "Invalid token") {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          router.push("/login");
          return;
        }

        if (!cancelled) {
          alert(error.message || "Failed to load preview");
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [filters, router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    const loadEmployees = async () => {
      try {
        const rows = await getEmployees(token);
        if (!cancelled) {
          setEmployees(rows);
        }
      } catch (error) {
        if (!cancelled) {
          alert(error.message || "Failed to load employees");
        }
      }
    };

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setExporting(true);
      await downloadAttendanceExport(filters, token);
    } catch (error) {
      alert(error.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => ({
    total: previewRows.length,
    role: filters.role,
    employee: filters.employeeId
      ? (employees.find((item) => String(item.id) === String(filters.employeeId))?.name || "Selected")
      : "All",
    format: filters.format,
  }), [previewRows.length, filters.role, filters.employeeId, filters.format, employees]);

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen">

      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">Export Data</h1>

      {/* Filter Card */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>

        <div className="grid grid-cols-5 gap-4">

          {/* From Date */}
          <div>
            <label className="text-sm text-gray-600">From Date</label>
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-sm text-gray-600">To Date</label>
            <input
              type="date"
              name="toDate"
              value={filters.toDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option>All</option>
              <option>HR</option>
              <option>IT</option>
              <option>Finance</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm text-gray-600">Export Format</label>
            <select
              name="format"
              value={filters.format}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>

          {/* Employee */}
          <div>
            <label className="text-sm text-gray-600">Employee</label>
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} (ID: {employee.id})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">

        <div className=" text-white p-5 rounded-lg shadow bg-blue-500">
          <p className="text-sm">Total Records</p>
          <h2 className="text-2xl font-bold">{summary.total}</h2>
        </div>

        <div className="bg-green-500 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Selected Role</p>
          <h2 className="text-2xl font-bold">{summary.role}</h2>
        </div>

        <div className="bg-purple-600 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Employee</p>
          <h2 className="text-2xl font-bold">{summary.employee}</h2>
        </div>

        <div className="bg-indigo-600 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Format</p>
          <h2 className="text-2xl font-bold uppercase">{summary.format}</h2>
        </div>

      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Live Preview</h2>
          {loadingPreview && <span className="text-sm text-gray-500">Loading...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {!loadingPreview && previewRows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={4}>
                    No matching attendance records.
                  </td>
                </tr>
              ) : (
                previewRows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.employee_name}</td>
                    <td className="p-3">{row.role}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">{formatDateTime(row.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={loadingPreview || exporting || summary.total === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {exporting ? "Exporting..." : "Export Data"}
        </button>
      </div>

    </div>
  );
}