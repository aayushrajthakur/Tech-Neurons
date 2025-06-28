from flask import Flask, request, jsonify, render_template
from audio_processor import AudioProcessor
from speech_recognizer import SpeechRecognizer
from risk_analyzer import RiskAnalyzer
import tempfile
import os
from flask_cors import CORS
from mongoengine import connect
import requests

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

# Connect to MongoDB
connect(
    host="mongodb+srv://yashmachhi1408:YAatlas%401408@cluster0.nuz5b2l.mongodb.net/ers2?retryWrites=true&w=majority"
)

# Services
audio_processor = AudioProcessor()
speech_recognizer = SpeechRecognizer()
risk_analyzer = RiskAnalyzer()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze_audio():
    if "audio" not in request.files:
        return jsonify(success=False, error="No audio file provided")

    audio_file = request.files["audio"]
    lat = request.form.get("lat")
    lng = request.form.get("lng")

    if not lat or not lng:
        return jsonify(success=False, error="Latitude and Longitude required")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            audio_file.save(tmp.name)
            temp_path = tmp.name

        # Process audio and transcribe
        processed_audio = audio_processor.process_audio(temp_path)
        result = speech_recognizer.recognize_speech(processed_audio, engine="google")

        if result["success"]:
            risk = risk_analyzer.analyze_risk(result["text"])
            emergency_type = risk.get("emergency_type", "General Emergency")

            # Save to DB
            try:
                response = requests.post("http://localhost:5000/api/emergency", json={
                    "patientName": "Voice Caller",
                    "contactNumber": "0000000000",
                    "category": emergency_type,
                    "priority": risk["risk_level"],
                    "description": result["text"],
                    "location": {"lat": float(lat), "lng": float(lng)},
                    "risk_score": risk["risk_score"],
                    "risk_level": risk["risk_level"]
                })
                if not response.ok:
                    return jsonify(success=False, error="Node backend error: " + response.text)

            except Exception as ex:
                return jsonify(success=False, error="Failed to send to backend: " + str(ex))
            return jsonify(
                success=True,
                risk_level=risk["risk_level"],
                risk_score=round(risk["risk_score"], 1),
                emergency_type=emergency_type
            )

        else:
            return jsonify(success=False, error=result["error"])

    except Exception as e:
        return jsonify(success=False, error=str(e))

    finally:
        try:
            os.unlink(temp_path)
            if processed_audio != temp_path:
                os.unlink(processed_audio)
        except Exception:
            pass

if __name__ == "__main__":
    app.run(debug=True, port=5001)
