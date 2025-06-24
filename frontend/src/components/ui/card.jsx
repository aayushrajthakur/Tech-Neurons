// src/components/ui/Card.jsx

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white light:bg-gray-800 border rounded-2xl shadow-md p-4 ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = '' }) => {
  return <div className={`mt-2 ${className}`}>{children}</div>;
};

export { Card, CardContent };
