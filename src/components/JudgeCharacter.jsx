import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const JudgeCharacter = ({ mousePos, isAngry }) => {
    const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        // Eye tracking logic targeting the character's face center
        // Adjust center X/Y based on the new character position transform
        // Character is approx at 25px offset left.
        const centerX = window.innerWidth * 0.25 + 25;
        const centerY = window.innerHeight / 2 - 40;

        const dx = mousePos.x - centerX;
        const dy = mousePos.y - centerY;
        const angle = Math.atan2(dy, dx);

        // Limit eye movement radius
        const maxRadius = 3;
        const x = Math.cos(angle) * maxRadius;
        const y = Math.sin(angle) * maxRadius;

        setPupilPos({ x, y });
    }, [mousePos]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* "Objection!" Speech Bubble */}
            <AnimatePresence>
                {isAngry && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 10, x: -20, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'absolute',
                            top: '20%',
                            left: '55%',
                            background: '#DC2626',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '16px',
                            borderBottomLeftRadius: '2px',
                            fontSize: '0.9rem',
                            fontWeight: '800',
                            zIndex: 20,
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '0.05em'
                        }}
                    >
                        OBJECTION!
                    </motion.div>
                )}
            </AnimatePresence>

            <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">

                {/* --- CHARACTER --- */}
                {/* Translated UP just slightly less extreme than before to ensure gavel fits */}
                <g transform="translate(25, -30) scale(1.6)">

                    {/* Body/Robe (Rich Black) */}
                    <path d="M 50 350 L 80 250 C 90 230, 200 230, 210 250 L 240 350 L 50 350 Z" fill="#111827" />
                    {/* White Stroke Detail lines on robe */}
                    <path d="M 120 350 L 110 300" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 170 350 L 180 300" stroke="white" strokeWidth="2" strokeLinecap="round" />

                    {/* Neck */}
                    <rect x="130" y="210" width="30" height="30" fill="#FDA4AF" />

                    {/* Collar (V-Shape) */}
                    <path d="M 130 240 L 145 265 L 160 240" fill="white" />

                    {/* HEAD GROUP */}
                    <g transform="translate(145, 180)">
                        {/* Hair: "Loopy" Cloud Style - Rich Blue */}
                        {/* Back Hair */}
                        <circle cx="0" cy="10" r="38" fill="#2563EB" />
                        <circle cx="-28" cy="20" r="22" fill="#2563EB" />
                        <circle cx="28" cy="20" r="22" fill="#2563EB" />

                        {/* Face Shape */}
                        <rect x="-25" y="-10" width="50" height="60" rx="22" fill="#FDA4AF" />

                        {/* Blush */}
                        <circle cx="-15" cy="30" r="6" fill="#F43F5E" opacity="0.2" />
                        <circle cx="15" cy="30" r="6" fill="#F43F5E" opacity="0.2" />

                        {/* Hair Front (Bangs) */}
                        <path d="M -25 -10 C -25 -35, 25 -35, 25 -10 C 25 2, 10 12, 0 8 C -10 2, -25 2, -25 -10" fill="#2563EB" />

                        {/* Swirl Accent in Hair */}
                        <path d="M -12 -18 Q 0 -28 12 -18" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

                        {/* Nose: Artistic 'L' */}
                        <path d="M 4 22 L 7 28 L 2 30" stroke="#9F1239" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

                        {/* Mouth */}
                        {isAngry ? (
                            <path d="M -6 48 Q 0 42 6 48" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
                        ) : (
                            <path d="M -6 45 Q 0 50 6 45" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
                        )}

                        {/* Glasses: Round Modern */}
                        <circle cx="-11" cy="18" r="11" stroke="#111827" strokeWidth="2.5" fill="none" />
                        <circle cx="13" cy="18" r="11" stroke="#111827" strokeWidth="2.5" fill="none" />
                        <line x1="0" y1="18" x2="2" y2="18" stroke="#111827" strokeWidth="2.5" />

                        {/* Eyes (Tracking) */}
                        <circle cx={-11 + pupilPos.x} cy={18 + pupilPos.y} r="3.5" fill="#111827" />
                        <circle cx={13 + pupilPos.x} cy={18 + pupilPos.y} r="3.5" fill="#111827" />
                    </g>

                    {/* ARM & GAVEL */}
                    {/* Added Explicit Transform Origin at Elbow/Pivot */}
                    <motion.g
                        animate={isAngry ? { rotate: [0, -35, 25, -10, 0] } : { rotate: [0, -3, 0] }}
                        transition={isAngry ? { duration: 0.5, type: "spring", stiffness: 300 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ originX: '200px', originY: '300px' }}
                        transform-origin="200 300"
                    >
                        {/* Arm holding gavel */}
                        <path d="M 210 280 Q 235 300 200 320" stroke="#111827" strokeWidth="28" strokeLinecap="round" fill="none" />
                        <path d="M 215 285 Q 230 300 205 315" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />

                        {/* Gavel Composite */}
                        <g transform="translate(198, 305) rotate(-50)">
                            {/* Handle */}
                            <rect x="-4" y="-45" width="8" height="55" rx="2" fill="#78350F" /> {/* Dark Wood */}

                            {/* Head Main Block */}
                            <rect x="-18" y="-55" width="36" height="24" rx="3" fill="#92400E" /> {/* Reddish Wood */}

                            {/* Gold Bands */}
                            <rect x="-18" y="-52" width="4" height="18" fill="#FBBF24" />
                            <rect x="14" y="-52" width="4" height="18" fill="#FBBF24" />

                            {/* Impact Faces */}
                            <ellipse cx="-18" cy="-43" rx="3" ry="8" fill="#5F2606" />
                            <ellipse cx="18" cy="-43" rx="3" ry="8" fill="#5F2606" />
                        </g>

                        {/* Hand (Circle) */}
                        <circle cx="200" cy="320" r="14" fill="#FDA4AF" />
                    </motion.g>

                </g>
            </svg>
        </div>
    );
};

export default JudgeCharacter;
