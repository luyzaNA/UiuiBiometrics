export const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

export const floatAnimation = {
    animate: {
        y: [0, -15, 0],
        transition: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

export const rotateAnimation = {
    animate: {
        rotate: 360,
        transition: {
            duration: 10,
            repeat: Infinity,
            ease: "linear",
        },
    },
};

export const pulseAnimation = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.8, 0.5],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

export const barAnimation = {
    animate: (i: number) => ({
        height: ["10%", "80%", "10%"],
        opacity: [0.3, 1, 0.3],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
        },
    }),
};