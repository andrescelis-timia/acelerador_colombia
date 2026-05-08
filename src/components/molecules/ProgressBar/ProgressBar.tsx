import { motion } from 'framer-motion';
import { ProgressBarProps } from './types';

export const ProgressBar = ({ progress, className }: ProgressBarProps) => (
  <div className={`relative h-4 bg-gray-100 rounded-full overflow-hidden ${className}`}>
    <motion.div
      className="absolute top-0 left-0 h-full bg-gradient-to-r from-timia-accent to-[#D4023A] rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    />
  </div>
); 