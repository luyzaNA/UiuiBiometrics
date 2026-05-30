interface CustomDotProps {
    cx?: number;
    cy?: number;
    payload?: { score: number; };
}

export const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, payload} = props;

    if (cx === undefined || cy === undefined || !payload) {
        return null;
    }

    return (
        <g>
            <circle
                cx={cx}
                cy={cy}
                r={5}
                className="transition-all duration-300 drop-shadow-sm fill-secondary-foreground"
                strokeWidth={2}
                style={{ cursor: "default" }}
            />

            <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                className="transition-all duration-300 drop-shadow-sm fill-secondary-foreground text-xs font-bold"
            >
                {payload.score}
            </text>
        </g>
    );
};