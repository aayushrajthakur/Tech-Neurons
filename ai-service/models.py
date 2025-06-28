from mongoengine import Document, StringField, FloatField, DictField, DateTimeField
import datetime

class Emergency(Document):
    patientName = StringField(default="Voice Caller")
    contactNumber = StringField(default="0000000000")
    category = StringField(required=True)
    priority = StringField(choices=["HIGH", "MEDIUM", "LOW"], required=True)
    description = StringField()
    location = DictField()  # contains lat/lng
    risk_score = FloatField()
    risk_level = StringField()
    status = StringField(choices=[
        "pending", "dispatched", "arrived_at_emergency",
        "transporting", "arrived_at_hospital", "resolved"
    ], default="pending")  # ✅ ADD THIS LINE
    timestamp = DateTimeField(default=datetime.datetime.utcnow)
