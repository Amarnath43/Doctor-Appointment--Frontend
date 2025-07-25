// src/pages/doctor/ProfileSection.jsx
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import useUserStore from '../../store/user';
import EditProfileForm from '../doctor/editProfileForm'

export default function ProfileSection() {
  // Pull the flattened doctor object right off your store:
  const user = useUserStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);

  const handleEditClick = () => {
    if (!user) {
      return toast.error('Profile data is not available.');
    }
    setIsOpen(true);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-center text-gray-500">Loading profile…</p>
      </div>
    );
  }

  // Destructure once for easy use:
  const {
    profilePicture,
    name,
    email,
    phone,
    specialization,
    experience,
    fee,
    bio,
    hospital,        // object with { name, location, phoneNumber, googleMapsLink }
  } = user;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="flex items-center gap-4">
       <img
          src={profilePicture || '/default-avatar.png'}
          alt="My avatar"
         className="h-40 w-40 rounded-full object-cover border"
        />
      
     </div>

      <div className="space-y-2">
        <div><strong>Name:</strong> {name}</div>
        <div><strong>Email:</strong> {email}</div>
        <div><strong>Phone:</strong> {phone}</div>
        <div><strong>Specialization:</strong> {specialization}</div>
        <div><strong>Experience:</strong> {experience} years</div>
        <div><strong>Consultation Fee:</strong> ₹{fee}</div>
        <div><strong>Bio:</strong> <span>{bio}</span></div>

        {hospital && (
          <div className="mt-2 space-y-1">
            <div><strong>Hospital:</strong> {hospital.name}</div>
            <div><strong>Location:</strong> {hospital.location}</div>
            <div><strong>Contact:</strong> {hospital.phoneNumber}</div>
            {hospital.googleMapsLink && (
              <div>
                <strong>Map:</strong>{' '}
                <a
                  href={hospital.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View on Google Maps
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleEditClick}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Edit Profile
      </button>

      {isOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50 overflow-y-auto"
    aria-modal="true"
    role="dialog"
  >
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
      <EditProfileForm
        initialData={user}
        onClose={() => setIsOpen(false)}
      />
    </div>
  </div>
)}

    </div>
  );
}
