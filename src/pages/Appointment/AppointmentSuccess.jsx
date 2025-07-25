import React from 'react';
import {  useLocation,useNavigate } from 'react-router-dom';
import { Check, Calendar, Clock, MapPin, DollarSign, ArrowRight, Home } from 'lucide-react';

const AppointmentSuccess = () => {
    const navigate = useNavigate();
    const { state }   = useLocation();
    const appointmentData = state?.appointmentData;

    

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Success Header */}
                <div className="text-center mb-4 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2 animate-scale-in">
                        <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        Appointment Confirmed!
                    </h1>
                    <p className="text-md text-gray-600">
                        Your appointment with Dr.{appointmentData?.doctorName} has been successfully scheduled
                    </p>
                </div>

                {/* Appointment Details Card */}
                <div className="mb-4 bg-white rounded-lg shadow-lg animate-fade-in overflow-hidden">
                    <div className="p-7">
                        <div className="space-y-6">
                            {/* Doctor Info */}
                            <div className="text-center pb-6 border-b border-gray-100">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                                    Dr. {appointmentData.doctorName}
                                </h2>
                                <p className="text-gray-600">{appointmentData.specialization}</p>
                            </div>

                            {/* Appointment Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date & Time */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Date & Time</h3>
                                        <p className="text-gray-700">{appointmentData.date}</p>
                                        <p className="text-gray-700">{appointmentData.time}</p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                                        <p className="text-gray-700">{appointmentData.location}</p>
                                    </div>
                                </div>

                                {/* Consultation Fee */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Consultation Fee</h3>
                                        <p className="text-gray-700">{appointmentData.fee}</p>
                                    </div>
                                </div>

                                {/* Appointment ID */}
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Appointment ID</h3>
                                        <p className="text-gray-700 font-mono">{appointmentData.appointmentId}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                                <h4 className="font-semibold text-amber-800 mb-2">Important Reminders:</h4>
                                <ul className="text-amber-700 text-sm space-y-1">
                                    <li>• Please arrive 15 minutes early for check-in</li>
                                    <li>• You'll receive a reminder 24 hours before your appointment</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                    <button
                        onClick={() => navigate(`/appointment/${appointmentData.appointmentId}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 inline-flex items-center justify-center"
                    >
                        View Full Details
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-2 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-105 inline-flex items-center justify-center"
                    >
                        <Home className="mr-2 w-5 h-5" />
                        Back to Home
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-3 text-gray-600 animate-fade-in">
                    <p>Need to make changes? Contact us at 7780579811 or support@quickmedilink.in</p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentSuccess;
