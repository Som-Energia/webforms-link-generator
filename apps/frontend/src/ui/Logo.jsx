import logo from "@somenergia/brand/logos/logo.svg";
import logoDark from "@somenergia/brand/logos/logo-dark.svg";

export default function LogoIcon({ theme = "light", width = 57, height = 35 }) {
  return (
    <img
      src={theme === "dark" ? logoDark : logo}
      alt="Som Energia"
      width={width}
      height={height}
    />
  );
}
