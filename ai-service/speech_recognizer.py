import speech_recognition as sr
import os
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpeechRecognizer:
    """
    Speech recognition class supporting multiple engines
    """
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        
        # Configure recognizer settings for better accuracy
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.operation_timeout = None
        self.recognizer.phrase_timeout = None
        self.recognizer.non_speaking_duration = 0.8
        
        # API keys from environment variables
        self.google_api_key = os.getenv("GOOGLE_SPEECH_API_KEY")
        self.wit_api_key = os.getenv("WIT_API_KEY", "default_wit_key")
        self.azure_api_key = os.getenv("AZURE_SPEECH_API_KEY")
        
        logger.info("SpeechRecognizer initialized")
    
    def recognize_speech(self, audio_file_path: str, engine: str = "google", 
                        language: str = "en-US") -> Dict[str, Any]:
        """
        Recognize speech from audio file using specified engine
        
        Args:
            audio_file_path (str): Path to audio file
            engine (str): Recognition engine ('google', 'sphinx', 'wit.ai')
            language (str): Language code for recognition
            
        Returns:
            dict: Recognition result with text, confidence, and success status
        """
        try:
            logger.info(f"Starting speech recognition with {engine} engine")
            
            # Load audio file
            with sr.AudioFile(audio_file_path) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                logger.info("Adjusted for ambient noise")
                
                # Record the audio data
                audio_data = self.recognizer.record(source)
                logger.info("Audio data recorded for recognition")
            
            # Choose recognition engine
            result = self._recognize_with_engine(audio_data, engine, language)
            
            if result['success']:
                logger.info(f"Recognition successful: {result['text'][:50]}...")
            else:
                logger.warning(f"Recognition failed: {result['error']}")
            
            return result
            
        except sr.UnknownValueError:
            error_msg = "Could not understand the audio. Please speak more clearly."
            logger.warning(error_msg)
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': error_msg
            }
        
        except sr.RequestError as e:
            error_msg = f"Recognition service error: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': error_msg
            }
        
        except Exception as e:
            error_msg = f"Unexpected error during recognition: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': error_msg
            }
    
    def _recognize_with_engine(self, audio_data, engine: str, language: str) -> Dict[str, Any]:
        """
        Perform recognition with specified engine
        
        Args:
            audio_data: Audio data from speech_recognition
            engine (str): Recognition engine
            language (str): Language code
            
        Returns:
            dict: Recognition result
        """
        try:
            if engine == "google":
                return self._recognize_google(audio_data, language)
            elif engine == "sphinx":
                return self._recognize_sphinx(audio_data, language)
            elif engine == "wit.ai":
                return self._recognize_wit(audio_data, language)
            else:
                # Default to Google if unknown engine
                logger.warning(f"Unknown engine '{engine}', falling back to Google")
                return self._recognize_google(audio_data, language)
                
        except Exception as e:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': f"Engine-specific error: {str(e)}"
            }
    
    def _recognize_google(self, audio_data, language: str) -> Dict[str, Any]:
        """Recognize speech using Google Web Speech API"""
        try:
            # Try with API key first, then without
            if self.google_api_key and self.google_api_key != "default_key":
                text = self.recognizer.recognize_google(
                    audio_data, 
                    key=self.google_api_key, 
                    language=language,
                    show_all=False
                )
            else:
                # Use free tier (limited requests)
                text = self.recognizer.recognize_google(
                    audio_data, 
                    language=language,
                    show_all=False
                )
            
            return {
                'success': True,
                'text': text,
                'confidence': 0.85,  # Google doesn't provide confidence in basic mode
                'error': None
            }
            
        except sr.UnknownValueError:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': "Google Speech Recognition could not understand the audio"
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': f"Google Speech Recognition service error: {str(e)}"
            }
    
    def _recognize_sphinx(self, audio_data, language: str) -> Dict[str, Any]:
        """Recognize speech using CMU Sphinx (offline)"""
        try:
            text = self.recognizer.recognize_sphinx(audio_data)
            
            return {
                'success': True,
                'text': text,
                'confidence': 0.70,  # Sphinx typically has lower accuracy
                'error': None
            }
            
        except sr.UnknownValueError:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': "Sphinx could not understand the audio"
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': f"Sphinx error: {str(e)}"
            }
    
    def _recognize_wit(self, audio_data, language: str) -> Dict[str, Any]:
        """Recognize speech using Wit.ai"""
        try:
            text = self.recognizer.recognize_wit(audio_data, key=self.wit_api_key)
            
            return {
                'success': True,
                'text': text,
                'confidence': 0.80,  # Wit.ai generally good accuracy
                'error': None
            }
            
        except sr.UnknownValueError:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': "Wit.ai could not understand the audio"
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'text': '',
                'confidence': 0.0,
                'error': f"Wit.ai service error: {str(e)}"
            }
    
    def test_microphone(self) -> Dict[str, Any]:
        """
        Test microphone accessibility and ambient noise levels
        
        Returns:
            dict: Test results
        """
        try:
            with sr.Microphone() as source:
                logger.info("Testing microphone...")
                
                # Adjust for ambient noise
                original_threshold = self.recognizer.energy_threshold
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                
                ambient_noise = self.recognizer.energy_threshold
                
                return {
                    'success': True,
                    'microphone_available': True,
                    'original_threshold': original_threshold,
                    'ambient_noise_level': ambient_noise,
                    'recommendation': self._get_noise_recommendation(ambient_noise)
                }
                
        except Exception as e:
            return {
                'success': False,
                'microphone_available': False,
                'error': f"Microphone test failed: {str(e)}"
            }
    
    def _get_noise_recommendation(self, noise_level: float) -> str:
        """Get recommendation based on ambient noise level"""
        if noise_level < 100:
            return "Excellent - Very quiet environment"
        elif noise_level < 300:
            return "Good - Low noise environment"
        elif noise_level < 600:
            return "Fair - Moderate noise, consider using noise reduction"
        elif noise_level < 1000:
            return "Poor - High noise environment, noise reduction recommended"
        else:
            return "Very Poor - Very noisy environment, find quieter location"
    
    def get_supported_languages(self) -> Dict[str, str]:
        """
        Get supported language codes
        
        Returns:
            dict: Language codes and names
        """
        return {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'es-ES': 'Spanish (Spain)',
            'es-MX': 'Spanish (Mexico)',
            'fr-FR': 'French (France)',
            'de-DE': 'German (Germany)',
            'it-IT': 'Italian (Italy)',
            'pt-BR': 'Portuguese (Brazil)',
            'ru-RU': 'Russian (Russia)',
            'ja-JP': 'Japanese (Japan)',
            'ko-KR': 'Korean (South Korea)',
            'zh-CN': 'Chinese (Simplified)',
            'zh-TW': 'Chinese (Traditional)',
            'ar-SA': 'Arabic (Saudi Arabia)',
            'hi-IN': 'Hindi (India)',
            'th-TH': 'Thai (Thailand)',
            'vi-VN': 'Vietnamese (Vietnam)',
            'nl-NL': 'Dutch (Netherlands)',
            'sv-SE': 'Swedish (Sweden)',
            'da-DK': 'Danish (Denmark)',
            'no-NO': 'Norwegian (Norway)',
            'fi-FI': 'Finnish (Finland)'
        }
