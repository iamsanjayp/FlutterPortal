import AdminSubmissions from "./admin/AdminSubmissions";
import staffApi from "../api/staffApi";

export default function StaffDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        <AdminSubmissions useRN useStaffApi staffApi={staffApi} />
      </div>
    </div>
  );
}