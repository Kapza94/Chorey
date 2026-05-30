import Svg, { Path } from "react-native-svg";

export function CheckCircleIcon({ color = "#6F8B67" }: { color?: string }) {
  return (
    <Svg
      accessibilityLabel="Done check"
      height={20}
      viewBox="0 0 24 24"
      width={20}
    >
      <Path
        d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-1.1-6.2 6.1-6.1-1.4-1.4-4.7 4.7-2.2-2.2-1.4 1.4 3.6 3.6Z"
        fill={color}
      />
    </Svg>
  );
}
