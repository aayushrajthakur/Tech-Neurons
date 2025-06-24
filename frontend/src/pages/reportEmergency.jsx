import ReportForm from "../components/emergency/emergencyReport";
const ReportEmergency = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">🚨 Report New Emergency</h1>
      <ReportForm />
    </div>
  );
};

export default ReportEmergency;
