import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export default function DoctorNurseIcon({ size = 24, color = '#0ea5e9', secondaryColor = '#38bdf8' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Cabeza / Rostro */}
      <Circle cx="16" cy="10.5" r="4.8" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.8" />
      
      {/* Gorro Médico / Cofia con Cruz Blanca */}
      <Path d="M11 9C11 6.2 13 4.5 16 4.5C19 4.5 21 6.2 21 9H11Z" fill={color} stroke={color} strokeWidth="1.5" />
      <Path d="M16 5.8V7.8M15 6.8H17" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
      
      {/* Bata Médica / Uniforme */}
      <Path d="M7.5 27.5C7.5 22.8 11 19 16 19C21 19 24.5 22.8 24.5 27.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      
      {/* Cuello en V */}
      <Path d="M12.5 19L16 23.5L19.5 19" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Estetoscopio Profesional en el Cuello */}
      <Path d="M11 20.5C11 23.8 13 25.5 16 25.5C19 25.5 21 23.8 21 20.5" stroke={secondaryColor} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 25.5V27.8" stroke={secondaryColor} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="16" cy="28.5" r="1.5" fill={secondaryColor} stroke={color} strokeWidth="0.8" />
    </Svg>
  );
}
