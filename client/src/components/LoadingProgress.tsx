import React from 'react';
import { Box } from '@mui/material';

const arcStyle = (
  duration: string,
  delay: string,
  color: string,
  rotate: number
): React.CSSProperties => ({
  transformOrigin: '50% 50%',
  animation: `spin ${duration} linear infinite`,
  animationDelay: delay,
  stroke: color,
  strokeLinecap: 'round',
  transform: `rotate(${rotate}deg)`
});

const LoadingProgress: React.FC = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    position="fixed"
    top={0}
    left={0}
    width="100vw"
    height="100vh"
    zIndex={1300}
    bgcolor="background.default"
  >
    <svg width={90} height={90} viewBox="0 0 90 90">
      <g>
        <circle
          cx="45" cy="45" r="32"
          fill="none"
          strokeWidth="3"
          style={arcStyle('2s', '0s', '#b39ddb', 0)}
          strokeDasharray="60 140"
        />
        <circle
          cx="45" cy="45" r="24"
          fill="none"
          strokeWidth="3"
          style={arcStyle('3s', '-0.4s', '#90a4ae', 0)}
          strokeDasharray="40 100"
        />
        <circle
          cx="45" cy="45" r="16"
          fill="none"
          strokeWidth="3"
          style={arcStyle('4s', '-0.8s', '#26c6da', 0)}
          strokeDasharray="25 70"
        />
      </g>
    </svg>
    <style>
      {`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </Box>
);

export default LoadingProgress; 