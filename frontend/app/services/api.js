const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const loginUser = async (data) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Login failed");
  }

  return res.json();
};
//----------signup API -------
export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Signup failed");
  }

  return res.json();
};

//----------Employees Api --------

export const getEmployees = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${API_URL}/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch employees");
  }

  return res.json();
};

//-------------Add Employee API-------------
export const addEmployee = async (data, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("role", data.role);
  formData.append("salary", String(data.salary));
  if (data.image instanceof File) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to add employee");
  }

  return res.json();
};

export const updateEmployee = async (id, data, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("email", data.email);
  formData.append("role", data.role);
  formData.append("salary", String(data.salary));
  if (data.image instanceof File) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to update employee");
  }

  return res.json();
};


export const deleteEmployee = async (id, token) => {
  await fetch(`${API_URL}/employees/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAttendance = async (token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${API_URL}/attendance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch attendance");
  }

  return res.json();
};

export const getAttendanceSummary = async (token) => {
  const headers = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  const res = await fetch(`${API_URL}/attendance/summary`, {
    headers,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch attendance summary");
  }

  return res.json();
};

export const updateAttendance = async (id, data, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${API_URL}/attendance/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to update attendance");
  }

  return res.json();
};


export const addAttendance = async (data, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const employeeId = Number(data?.employee_id);
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const status = data?.status || "Present";
  const date = data?.date;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const params = new URLSearchParams();
  params.set("status", status);
  if (date) {
    params.set("date", date);
  }

  const url = `${backendUrl}/attendance/${employeeId}?${params.toString()}`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    throw new Error(`Network error: ${error.message}. Is backend running at ${backendUrl}?`);
  }

  if (!res.ok) {
    let errorDetail = "Failed to add attendance";
    try {
      const errorData = await res.json();
      errorDetail = errorData.detail || errorData.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
};

export const getAttendanceExportPreview = async (filters, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const params = new URLSearchParams();
  if (filters?.fromDate) params.set("fromDate", filters.fromDate);
  if (filters?.toDate) params.set("toDate", filters.toDate);
  if (filters?.role) params.set("role", filters.role);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);

  const res = await fetch(`${API_URL}/attendance/export/preview?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to fetch export preview");
  }

  return res.json();
};

export const downloadAttendanceExport = async (filters, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const params = new URLSearchParams();
  params.set("format", filters?.format || "csv");
  if (filters?.fromDate) params.set("fromDate", filters.fromDate);
  if (filters?.toDate) params.set("toDate", filters.toDate);
  if (filters?.role) params.set("role", filters.role);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);

  const res = await fetch(`${API_URL}/attendance/export?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to export attendance");
  }

  const blob = await res.blob();
  const extension = (filters?.format || "csv") === "excel" ? "xlsx" : "csv";
  const filename = `attendance_export.${extension}`;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

//  -------- Profile API --------
export const getProfile = async (token) => {
  const res = await fetch(`${API_URL}/users/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
};

export const updateProfile = async (data, token) => {
  if (!token) {
    throw new Error("Unauthorized");
  }

  const formData = new FormData();
  formData.append("email", data.email);
  formData.append("role", data.role);
  if (data.image instanceof File) {
    formData.append("image", data.image);
  }

  const res = await fetch(`${API_URL}/users/me`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || "Failed to update profile");
  }

  return res.json();
};
