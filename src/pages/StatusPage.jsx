import React from 'react';
import { Hourglass, LogOut, ShieldX } from 'lucide-react';
import useUserStore from '../store/user';
import { removeToken } from '../helper';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'

const StatusPage = ({ userRole = 'doctor', status = 'pending' }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        const { clearUser } = useUserStore.getState();
        clearUser();
        removeToken();
        navigate('/');
        toast.success('Logged out successfully');
    };

    // Configuration for different roles and statuses
    const contentConfig = {
        doctor: {
            pending: {
                icon: <Hourglass className="w-8 h-8 text-amber-500" />,
                iconBg: 'bg-amber-100 border-amber-50',
                title: 'Waiting for Approval',
                message: 'Your profile has been submitted and is currently under review by our admin team. You will be notified via email once your account is activated.',
            },
            blocked: {
                icon: <ShieldX className="w-8 h-8 text-red-500" />,
                iconBg: 'bg-red-100 border-red-50',
                title: 'Account Blocked',
                message: 'Your account has been blocked by the administration. Please contact support for further information.',
            },
        },
        user: {
            pending: {
                icon: <Hourglass className="w-8 h-8 text-amber-500" />,
                iconBg: 'bg-amber-100 border-amber-50',
                title: 'Account Pending',
                message: 'Your account is pending activation. Please check your email for a verification link or contact support if this persists.',
            },
            blocked: {
                icon: <ShieldX className="w-8 h-8 text-red-500" />,
                iconBg: 'bg-red-100 border-red-50',
                title: 'Account Blocked',
                message: 'Your account has been blocked due to a violation of our terms of service. Please contact support for assistance.',
            },
        },
    };


    const currentContent = contentConfig[userRole]?.[status] || contentConfig.user.blocked;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">

                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center border-4 mb-5 ${currentContent.iconBg}`}>
                        {currentContent.icon}
                    </div>

                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {currentContent.title}
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 leading-relaxed">
                        {currentContent.message}
                    </p>

                    {/* Separator */}
                    <div className="my-6 border-t border-gray-200"></div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-all disabled:bg-gray-400"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-6">
                    © {new Date().getFullYear()} QuickMediLink. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default StatusPage;
