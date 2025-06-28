import numpy as np
import tempfile
import os
from pydub import AudioSegment
from pydub.effects import normalize
from scipy.signal import butter, filtfilt
from scipy.io import wavfile
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Audio processing class for noise reduction and audio enhancement
    """
    
    def __init__(self):
        self.supported_formats = ['.wav', '.mp3', '.flac', '.ogg', '.m4a']
    
    def process_audio(self, input_path, noise_reduction=True, volume_normalization=True, 
                     target_sample_rate=16000):
        """
        Process audio file with various enhancement techniques
        
        Args:
            input_path (str): Path to input audio file
            noise_reduction (bool): Apply noise reduction
            volume_normalization (bool): Apply volume normalization
            target_sample_rate (int): Target sample rate for output
            
        Returns:
            str: Path to processed audio file
        """
        try:
            logger.info(f"Processing audio file: {input_path}")
            
            # Load audio file using pydub
            audio = AudioSegment.from_file(input_path)
            
            # Convert to mono if stereo
            if audio.channels > 1:
                audio = audio.set_channels(1)
                logger.info("Converted stereo to mono")
            
            # Set target sample rate
            if audio.frame_rate != target_sample_rate:
                audio = audio.set_frame_rate(target_sample_rate)
                logger.info(f"Resampled to {target_sample_rate} Hz")
            
            # Volume normalization
            if volume_normalization:
                audio = normalize(audio)
                logger.info("Applied volume normalization")
            
            # Apply noise reduction if requested
            if noise_reduction:
                audio = self._apply_noise_reduction(audio)
                logger.info("Applied noise reduction")
            
            # Save processed audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                output_path = tmp_file.name
            
            audio.export(output_path, format="wav")
            logger.info(f"Processed audio saved to: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            raise Exception(f"Audio processing failed: {str(e)}")
    
    def _apply_noise_reduction(self, audio_segment):
        """
        Apply noise reduction to audio segment
        
        Args:
            audio_segment: pydub AudioSegment object
            
        Returns:
            AudioSegment: Processed audio with reduced noise
        """
        try:
            # Convert to numpy array for processing
            samples = np.array(audio_segment.get_array_of_samples(), dtype=np.float32)
            sample_rate = audio_segment.frame_rate
            
            # Normalize to [-1, 1] range
            if samples.max() > 0:
                samples = samples / np.max(np.abs(samples))
            
            # Apply high-pass filter to remove low-frequency noise
            samples = self._high_pass_filter(samples, sample_rate, cutoff=80)
            
            # Apply spectral subtraction for noise reduction
            samples = self._spectral_subtraction(samples, sample_rate)
            
            # Apply low-pass filter to remove high-frequency noise
            samples = self._low_pass_filter(samples, sample_rate, cutoff=8000)
            
            # Convert back to integer format
            samples = np.clip(samples * 32767, -32768, 32767).astype(np.int16)
            
            # Create new AudioSegment from processed samples
            processed_audio = AudioSegment(
                samples.tobytes(),
                frame_rate=sample_rate,
                sample_width=2,  # 16-bit
                channels=1
            )
            
            return processed_audio
            
        except Exception as e:
            logger.warning(f"Noise reduction failed, returning original audio: {str(e)}")
            return audio_segment
    
    def _high_pass_filter(self, data, sample_rate, cutoff=80, order=5):
        """Apply high-pass filter to remove low-frequency noise"""
        try:
            nyquist = 0.5 * sample_rate
            normal_cutoff = cutoff / nyquist
            b, a = butter(order, normal_cutoff, btype='high', analog=False)
            return filtfilt(b, a, data)
        except:
            return data
    
    def _low_pass_filter(self, data, sample_rate, cutoff=8000, order=5):
        """Apply low-pass filter to remove high-frequency noise"""
        try:
            nyquist = 0.5 * sample_rate
            normal_cutoff = cutoff / nyquist
            b, a = butter(order, normal_cutoff, btype='low', analog=False)
            return filtfilt(b, a, data)
        except:
            return data
    
    def _spectral_subtraction(self, data, sample_rate, alpha=2.0, beta=0.01):
        """
        Apply spectral subtraction for noise reduction
        
        Args:
            data: Audio signal
            sample_rate: Sample rate
            alpha: Over-subtraction factor
            beta: Spectral floor factor
            
        Returns:
            Processed audio signal
        """
        try:
            # Use first 0.5 seconds as noise sample (if available)
            noise_duration = min(int(0.5 * sample_rate), len(data) // 4)
            
            if noise_duration < 1024:  # Not enough data for noise estimation
                return data
            
            noise_sample = data[:noise_duration]
            
            # Estimate noise spectrum
            noise_fft = np.fft.fft(noise_sample)
            noise_magnitude = np.abs(noise_fft)
            noise_power = noise_magnitude ** 2
            
            # Process in overlapping windows
            window_size = 1024
            hop_size = window_size // 2
            output = np.zeros_like(data)
            
            for i in range(0, len(data) - window_size, hop_size):
                window = data[i:i + window_size]
                
                # Apply window function
                windowed = window * np.hanning(window_size)
                
                # FFT
                signal_fft = np.fft.fft(windowed)
                signal_magnitude = np.abs(signal_fft)
                signal_phase = np.angle(signal_fft)
                signal_power = signal_magnitude ** 2
                
                # Spectral subtraction
                # Resize noise_power to match signal_power
                if len(noise_power) != len(signal_power):
                    noise_power_resized = np.interp(
                        np.linspace(0, 1, len(signal_power)),
                        np.linspace(0, 1, len(noise_power)),
                        noise_power
                    )
                else:
                    noise_power_resized = noise_power
                
                # Subtract noise with over-subtraction factor
                clean_power = signal_power - alpha * noise_power_resized
                
                # Apply spectral floor
                clean_power = np.maximum(clean_power, beta * signal_power)
                
                # Reconstruct magnitude
                clean_magnitude = np.sqrt(clean_power)
                
                # Reconstruct signal
                clean_fft = clean_magnitude * np.exp(1j * signal_phase)
                clean_signal = np.real(np.fft.ifft(clean_fft))
                
                # Overlap and add
                output[i:i + window_size] += clean_signal * np.hanning(window_size)
            
            return output
            
        except Exception as e:
            logger.warning(f"Spectral subtraction failed: {str(e)}")
            return data
    
    def get_audio_info(self, file_path):
        """
        Get information about audio file
        
        Args:
            file_path (str): Path to audio file
            
        Returns:
            dict: Audio file information
        """
        try:
            audio = AudioSegment.from_file(file_path)
            return {
                'duration': len(audio) / 1000.0,  # Duration in seconds
                'sample_rate': audio.frame_rate,
                'channels': audio.channels,
                'bit_depth': audio.sample_width * 8,
                'format': os.path.splitext(file_path)[1].lower()
            }
        except Exception as e:
            logger.error(f"Error getting audio info: {str(e)}")
            return None
