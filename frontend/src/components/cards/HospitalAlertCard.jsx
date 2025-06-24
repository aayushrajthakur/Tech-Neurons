// HospitalAlertCard.jsx - placeholder
// src/components/cards/HospitalAlertCard.jsx
import { Card, CardContent } from '../ui/card';

const HospitalAlertCard = ({ hospital }) => {
  return (
    <Card className="mb-4">
      <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{hospital.name}</h2>
      <CardContent>
        <p><strong>Load:</strong> {hospital.load}%</p>
        <p><strong>Specialties:</strong> {hospital.specialties.join(', ')}</p>
        <p><strong>Location:</strong> {hospital.location.lat}, {hospital.location.lng}</p>
      </CardContent>
    </Card>
  );
};

export default HospitalAlertCard;
