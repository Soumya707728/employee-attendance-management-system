
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { getProfile, updateProfile } from "../services/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [form, setForm] = useState({ email: "", role: "", image: null });
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await getProfile(token);
        setUser(data);
        setForm({
          email: data.email || "",
          role: data.role || "",
          image: null,
        });
      } catch {
        alert("Failed to load profile");
      }
    };

    fetchProfile();
  }, [router]);

  const getImageSrc = (value) => {
    if (!value) return "/assets/avatar-placeholder.png";
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `${API_URL}${value}`;
  };

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openUpdateForm = () => {
    setForm({
      email: user?.email || "",
      role: user?.role || "",
      image: null,
    });
    setShowEditForm(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await updateProfile(form, token);
      setUser(updated);
      localStorage.setItem("role", updated.role || "employee");
      setShowEditForm(false);
    } catch (error) {
      alert(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return <p className="p-10 text-center text-xl text-gray-600">Loading profile...</p>;

  return (
    <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 min-h-screen">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your profile information</p>
        </div>
        <button
          type="button"
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-lg font-semibold transition duration-300 transform hover:scale-105 shadow-lg"
          onClick={openUpdateForm}
        >
          ✎ Update Profile
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
        <div className="flex gap-12 items-start">
          {/* Profile Image */}
          <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-4 border-indigo-200 shadow-xl flex-shrink-0">
            <Image
              src={getImageSrc(user.image_url)}
              alt="profile"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* Info Section */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Information</h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Employee ID</p>
                <p className="text-xl font-semibold text-gray-800">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Email</p>
                <p className="text-xl font-semibold text-gray-800">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Role</p>
                <p className="text-xl font-semibold text-blue-600">{user.role}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">Joined On</p>
                <p className="text-xl font-semibold text-gray-800">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditForm && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl border border-gray-100">
      
      <h2 className="text-2xl font-bold text-center text-gray-800">Update Your Profile</h2>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
        <input
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          type="email"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
        <input
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
          value={form.role}
          onChange={(e) => onChange("role", e.target.value)}
          placeholder="Your role"
          required
        />
      </div>

      {/* Image Upload UI */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300">
          {form.image ? (
            <Image
              src={URL.createObjectURL(form.image)}
              alt="Preview"
              className="w-full h-full object-cover"
              width={112}
              height={112}
            />
          ) : (
            <span className="text-gray-500 text-sm text-center">📷 No Image</span>
          )}
        </div>

        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange("image", e.target.files?.[0] || null)}
        />

        <label
          htmlFor="imageUpload"
          className="cursor-pointer bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-2 rounded-lg font-semibold transition duration-300"
        >
          📸 Choose Photo
        </label>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => setShowEditForm(false)}
          className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          disabled={isUpdating}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-2 rounded-lg font-semibold transition duration-300 disabled:opacity-60"
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "✓ Update"}
        </button>
      </div>

    </form>
  </div>
      )}
    </div>
  );
}