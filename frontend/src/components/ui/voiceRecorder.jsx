// components/ui/VoiceRecorder.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";
import { Mic, StopCircle, Activity } from "lucide-react"; 


const VoiceRecorder = ({ onRecordingComplete }) => {
  const { recording, audioBlob, startRecording, stopRecording } = useVoiceRecorder();

  const handleStop = () => {
    stopRecording();
    if (onRecordingComplete && audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-xl transition-all duration-300">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        🎙️ Record Emergency Audio
      </h2>

      {/* Animated Mic */}
      <div className="flex flex-col items-center justify-center">
        <AnimatePresence>
          {recording && (
            <motion.div
              className="relative w-24 h-24 rounded-full bg-red-500 shadow-xl flex items-center justify-center"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0.85, 1] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Mic className="text-white w-10 h-10" />
              <motion.div
                className="absolute border-4 border-red-400 rounded-full w-full h-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!recording && (
          <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shadow-md transition-all duration-300">
            <Mic className="text-gray-700 dark:text-gray-300 w-10 h-10" />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={startRecording}
            disabled={recording}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-40 transition-all"
          >
            🎙️ Start
          </button>
          <button
            onClick={handleStop}
            disabled={!recording}
            className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md disabled:opacity-40 transition-all"
          >
            ⏹ Stop
          </button>
        </div>
      </div>

      {/* Animated Waveform Bars */}
      {recording && (
        <div className="flex justify-center gap-1 mt-6">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-sm bg-blue-400"
              animate={{
                height: ["0.5rem", "2rem", "1rem"],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {/* Playback */}
      {audioBlob && !recording && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">✅ Audio recorded:</p>
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full rounded-md" />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
