import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { ProgressDialogProps } from './types';

export const ProgressDialog = ({ title, steps, onComplete }: ProgressDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);

  useEffect(() => {
    const startTime = Date.now();
    let currentStepStartTime = startTime;
    let stepIndex = 0;

    const updateProgress = () => {
      const now = Date.now();
      const elapsedTotal = now - startTime;
      const elapsedStep = now - currentStepStartTime;

      if (stepIndex < steps.length) {
        const currentStepDuration = steps[stepIndex].duration;

        if (elapsedStep >= currentStepDuration) {
          stepIndex++;
          currentStepStartTime = now;
          setCurrentStep(stepIndex);
        }

        const progressValue = (elapsedTotal / totalDuration) * 100;
        setProgress(Math.min(progressValue, 100));

        if (progressValue < 100) {
          requestAnimationFrame(updateProgress);
        } else {
          setIsComplete(true);
          setTimeout(onComplete, 1500);
        }
      }
    };

    requestAnimationFrame(updateProgress);
  }, [steps, totalDuration, onComplete]);

  return (
    <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-6 w-[480px] z-50">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{title}</h2>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <ProgressBar progress={progress} />
            <motion.div
              key={currentStep}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="text-center text-sm font-medium text-gray-600"
            >
              {currentStep < steps.length ? steps[currentStep].label : ''}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-muted mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-success">Exitoso</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 