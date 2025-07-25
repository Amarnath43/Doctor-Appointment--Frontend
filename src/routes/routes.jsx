import HomePage from '../pages/HomePage'
import RegisterDoctor from '../pages/RegisterDoctor'
import RegisterUser from '../pages/RegisterUser'
import SearchDoctors from '../pages/SearchDoctors';
import Signin from '../pages/Signin';
import DoctorDashboardLayout from '../layouts/DoctorDashboardLayout';
import Analytics from '../pages/doctor/Analytics';
import SetDoctorSlots from '../pages/doctor/setDoctorSlots';
import AppointmentHistory from '../pages/doctor/appointmentHistory';
import EditProfile from '../pages/doctor/editProfile';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import AboutUs from '../pages/AboutUs';
import ContactPage from '../pages/ContactPage';
import HospitalsPage from '../pages/HospitalsPage';
import HospitalPage from '../pages/HospitalPage';
import GoToDetailsPage from '../pages/GoToDetailsPage';
import AppointmentSuccess from '../pages/Appointment/AppointmentSuccess';
import AppointmentDetails from '../pages/Appointment/AppointmentDetails';
import AppointmentList from '../components/user/AppointmentList'
import UserDashboardLayout from '../layouts/UserDashboardLayout';
import UserProfile from '../pages/user/UserProfile';
import AdminDashboardLayout from '../layouts/AdminDashboardLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import AdminApprovalPanel from '../components/Admin/AdminApprovalPanel';
import AllUsers from '../components/Admin/AllUsers';
import HospitalList from '../components/Admin/HospitalList';
import AppointmentHistoryAdmin from '../pages/Admin/AppointmentHistoryAdmin';


const appRoutes = [
  { path: '/', element: <HomePage /> },
  //{path: '/login', element: <LoginPage/>},
  { path: '/doctor/register', element: <RegisterDoctor /> },
  { path: '/user/register', element: <RegisterUser /> },
  { path: '/signin', element: <Signin /> },
  { path: '/search-doctors', element: <SearchDoctors /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/aboutUs', element: <AboutUs /> },
  { path: '/contactPage', element: <ContactPage /> },
  { path: '/hospitals', element: <HospitalsPage /> },
  { path: '/hospitals/:hospitalId', element: <HospitalPage /> },
  { path: '/doctor/:id', element: <GoToDetailsPage /> },

  { path: '/appointment/success', element: <AppointmentSuccess /> },
  { path: '/appointment/:appointmentId', element: <AppointmentDetails /> },
  // Doctor Dashboard Routes
  {
    path: '/doctor',
    element: <ProtectedRoute allowedRoles={['doctor']} />,
    children: [
      {
        path: 'dashboard',
        element: <DoctorDashboardLayout />,
        children: [
          { index: true, element: <Navigate to="analytics" replace /> },
          { path: 'analytics', element: <Analytics /> },
          { path: 'slots', element: <SetDoctorSlots /> },
          { path: 'history', element: <AppointmentHistory /> },
          { path: 'profile', element: <EditProfile /> },
        ]
      }


    ]
  },



  {
  path: '/user',
  element: <ProtectedRoute allowedRoles={['user']} />,
  children: [
    {
      path: 'dashboard',
      element: <UserDashboardLayout />,
      children: [
        // Default redirect to upcoming
        { index: true, element: <Navigate to="appointment-history/upcoming" replace /> },

        // Appointment routes
        { path: 'appointment-history/upcoming', element: <AppointmentList /> },
        { path: 'appointment-history/past', element: <AppointmentList /> },
        { path: 'appointment-history/cancelled', element: <AppointmentList /> },
        {path:'profile',element:<UserProfile/>}

        // Profile route
        //{ path: 'profile', element: <UserProfile /> }
      ]
    }
  ]
},

{
  path: '/admin',
  element: <ProtectedRoute allowedRoles={['admin']} />,
  children: [
    {
      path: 'dashboard',
      element: <AdminDashboardLayout />,
      children: [
        
        { index: true, element: <Navigate to="analytics" replace /> },
        
        { path: 'analytics', element: <AdminDashboard/> },
        { path: 'manage-entities', element: <AdminApprovalPanel /> },
        {path:'allusers',element:<AllUsers/>},
        {path:'hospital-list', element:<HospitalList/>},
        {path:'appointment-history',element:<AppointmentHistoryAdmin/>}
      ]
    }
  ]
}

];

export default appRoutes;