import { AlertCircle, Clock, Calendar } from 'lucide-react';

export default function ErrorPage({ type = "schedule", onBack }) {
  const errorConfig = {
    schedule: {
      icon: Clock,
      title: "No Active Test Session",
      message: "The test portal is only available during scheduled test windows.",
      description: "Please check back when the test session is active. Contact your instructor if you believe this is an error.",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonText: "Back to Login"
    },
    unauthorized: {
      icon: AlertCircle,
      title: "Access Denied",
      message: "You don't have permission to access this resource.",
      description: "If you believe this is an error, please contact your administrator.",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonText: "Back to Login"
    },
    inactive: {
      icon: AlertCircle,
      title: "Account Inactive",
      message: "Your account has been deactivated.",
      description: "Please contact your administrator to reactivate your account.",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      buttonText: "Back to Login"
    }
  };

  const config = errorConfig[type] || errorConfig.schedule;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-lg">
        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          {/* Icon */}
          <div className={`mx-auto mb-6 h-16 w-16 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-3">
            {config.title}
          </h1>

          {/* Message */}
          <p className="text-base text-slate-600 text-center mb-2">
            {config.message}
          </p>

          {/* Description */}
          <p className="text-sm text-slate-500 text-center mb-8">
            {config.description}
          </p>

          {/* Test Schedule Info (for schedule errors) */}
          {type === "schedule" && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    Test Schedule Information
                  </h3>
                  <p className="text-xs text-blue-700">
                    Tests are only available during designated time slots. Check your course portal or contact your instructor for the schedule.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onBack}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {config.buttonText}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Need help? Contact your course administrator
          </p>
        </div>
      </div>
    </div>
  );
}
