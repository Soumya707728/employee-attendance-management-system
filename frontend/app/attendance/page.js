"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttendance, getAttendanceSummary, updateAttendance, addAttendance, getEmployees } from "../services/api";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [search, setSearch]= useState("");
  const [employees, setEmployees] = useState([]);
  const [role, setRole] = useState("employee");
  const [username, setUsername] = useState("");
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [savingId, setSavingId] = useState(null);
  const [summary, setSummary] = useState({ total_employees: 0, present: 0, absent: 0, leave: 0 });
  const [formData, setFormData] = useState({ employee_id: "", role: "", date: "", status: "Present" });
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const normalizedRole = role.trim().toLowerCase();
  const isHr = normalizedRole === "hr";
  const canViewAllAttendance = normalizedRole === "hr" || normalizedRole === "manager" || normalizedRole === "manger";

  const loadSummary = useCallback(async (token) => {
    try {
      const summaryData = await getAttendanceSummary(token);
      setSummary(summaryData);
    } catch (error) {
      if (error.message === "Unauthorized" || error.message === "Invalid token") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        router.push("/login");
        return;
      }

      alert(error.message || "Failed to load attendance summary");
    }
  }, [router]);

  useEffect(() => {
    const loadAttendance = async (token) => {
      try {
        const data = await getAttendance(token);
        setAttendance(data);
      } catch (error) {
        if (error.message === "Unauthorized" || error.message === "Invalid token") {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          router.push("/login");
          return;
        }

        alert(error.message || "Failed to load attendance");
      }
    };

    const loadEmployeesList = async (token) => {
      try {
        const data = await getEmployees(token);
        setEmployees(data);
      } catch (error) {
        if (error.message === "Unauthorized" || error.message === "Invalid token") {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("username");
          router.push("/login");
          return;
        }

        alert(error.message || "Failed to load employees");
      }
    };

    const token = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role") || "employee";
    const savedUsername = localStorage.getItem("username") || "";
    const savedEmployeeId = localStorage.getItem("employee_id") || "";
    setRole(savedRole);
    setUsername(savedUsername);
    setCurrentEmployeeId(savedEmployeeId);

    if (!token) {
      router.push("/login");
      return;
    }

    loadAttendance(token);
    loadEmployeesList(token);
    loadSummary(token);
  }, [router, loadSummary]);

  const onEmployeeChange = (employeeId) => {
    const selectedEmployee = employees.find((item) => String(item.id) === String(employeeId));

    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      role: selectedEmployee?.role || "",
    }));
  };

  const onStatusChange = (id, nextStatus) => {
    setAttendance((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status: nextStatus,
            }
          : row
      )
    );
  };

  const saveAttendance = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingId(row.id);
      const updated = await updateAttendance(row.id, { status: row.status }, token);

      setAttendance((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                ...updated,
              }
            : item
        )
      );

      await loadSummary(token);
    } catch (error) {
      alert(error.message || "Failed to update attendance");
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!formData.employee_id) {
      alert("Please select an employee");
      return;
    }

    try {
      const newRecord = await addAttendance(formData, token);

      const updatedData = [...attendance, newRecord];
      setAttendance(updatedData);

      await loadSummary(token);

      setShowModal(false);

      setFormData({
        employee_id: "",
          role: "",
        date: "",
        status: "Present",
      });
    } catch (error) {
      alert(error.message);
    }

  };
  const matchesCurrentUser = (row) => {
    if (currentEmployeeId && String(row.employee_id) === String(currentEmployeeId)) {
      return true;
    }

    if (!username) {
      return false;
    }

    return (row.employee_name || "").trim().toLowerCase() === username.trim().toLowerCase();
  };

  const filteredAttendance = attendance.filter((row) => {
    if (!canViewAllAttendance && !matchesCurrentUser(row)) {
      return false;
    }

    const query = search.toLowerCase();

    return (
      (row.employee_name || "").toLowerCase().includes(query) ||
      (row.role || "").toLowerCase().includes(query) ||
      (row.status || "").toLowerCase().includes(query)
    );
  });

  const toDayKey = (value) => {
    const day = new Date(value);
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const loginEmployeeAttendance = attendance.filter(matchesCurrentUser);

  const attendanceByDay = loginEmployeeAttendance.reduce((acc, row) => {
    const key = toDayKey(row.date);
    const previous = acc[key];

    if (!previous || new Date(row.date) > new Date(previous.date)) {
      acc[key] = row;
    }

    return acc;
  }, {});

  const monthYearLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const leadingBlankDays = firstDayOfMonth.getDay();

  const calendarCells = [
    ...Array.from({ length: leadingBlankDays }, (_, idx) => `blank-${idx}`),
    ...Array.from({ length: daysInMonth }, (_, idx) => idx + 1),
  ];

  const getStatusClass = (status) => {
    if (status === "Present") return "bg-emerald-100 border-emerald-300 text-emerald-900";
    if (status === "Absent") return "bg-rose-100 border-rose-300 text-rose-900";
    if (status === "Leave") return "bg-amber-100 border-amber-300 text-amber-900";
    return "bg-slate-50 border-slate-200 text-slate-500";
  };

  const goPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
     <h1 className="text-4xl font-bold">Attendance</h1>
      <div className="grid grid-cols-4 gap-6 mb-8 mt-3">

        <div className="bg-teal-500 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Total Employees</p>
          <h2 className="text-2xl font-bold">{summary.total_employees}</h2>
        </div>


        <div className="bg-purple-700 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Present</p>
          <h2 className="text-2xl font-bold">{summary.present}</h2>
        </div>

        <div className="bg-orange-500 text-white p-5 rounded-lg shadow">
          <p className="text-sm">Absent</p>
          <h2 className="text-2xl font-bold">{summary.absent}</h2>
        </div>

        <div className="bg-green-600 text-white p-5 rounded-lg shadow">
          <p className="text-sm">On Leave</p>
          <h2 className="text-2xl font-bold">{summary.leave}</h2>
        </div>

      </div>


      <div className="flex justify-between items-center mb-6">
       
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-1/2"
        />
        
        {isHr && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded place-items-end"
            onClick={() => {
              setFormData({ employee_id: "", role: "", date: "", status: "Present" });
              setShowModal(true);
            }}
          >
            Mark Attendance
          </button>
        )}
        </div>
        <p className="text-sm text-gray-600 place-self-end mb-4">
          {isHr ? "HR mode: You can edit attendance" : "View-only mode: Only HR can edit attendance"}
        </p>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm">
              <th className="p-3">Employee</th>
              <th className="p-3">Role</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAttendance.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500" colSpan={6}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              filteredAttendance.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">{row.employee_name}</td>
                  <td className="p-3">{row.role}</td>
                  <td className="p-3">{formatDate(row.date)}</td>
                  <td className="p-3">{formatTime(row.date)}</td>
                  <td className="p-3">
                    <select
                      value={row.status}
                      onChange={(e) => onStatusChange(row.id, e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={!isHr}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {isHr ? (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-60"
                        onClick={() => saveAttendance(row)}
                        disabled={savingId === row.id}
                      >
                        {savingId === row.id ? "Saving..." : "Save"}
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">Read only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
            </table>
          </div>
        </div>


      {/* calender view */}
        <div className="xl:col-span-4 xl:self-start rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">My Attendance Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevMonth}
                className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Prev
              </button>
              <p className="min-w-32 text-center text-sm font-semibold text-slate-700">{monthYearLabel}</p>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Next
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            Showing attendance for: {username || "Logged-in employee"}
          </p>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              if (typeof cell !== "number") {
                return <div key={cell} className="h-14 rounded-md bg-transparent" />;
              }

              const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-${String(cell).padStart(2, "0")}`;
              const dayAttendance = attendanceByDay[dateKey];
              const status = dayAttendance?.status;

              return (
                <div
                  key={dateKey}
                  className={`h-14 rounded-md border px-2 py-1.5 flex flex-col justify-between transition-colors ${getStatusClass(status)}`}
                >
                  <span className="text-xs font-bold">{cell}</span>
                  <span className="truncate text-[10px] font-medium">{status || "-"}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-emerald-300" /> Present
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-rose-300" /> Absent
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-amber-300" /> Leave
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <form className="bg-white p-6 rounded-lg w-96 space-y-3" onSubmit={handleSubmit}>
              <h2 className="text-lg font-semibold mb-4">
                Add Attendance
              </h2>
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.employee_id}
                onChange={(e) => onEmployeeChange(e.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} (ID: {employee.id})
                  </option>
                ))}
              </select>
              
              <input
                placeholder="Role"
                className="w-full border rounded px-3 py-2"
                value={formData.role}
                readOnly
              />
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <select
                className="w-full border rounded px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}