import React from "react";
import { colors, fonts } from "../theme";

// Wordmark de texto. Para usar el logo real, pon el archivo en
// public/logo.png y cambia esto por <Img src={staticFile("logo.png")} />.
export const Logo: React.FC<{ size?: number; style?: React.CSSProperties }> = ({
  size = 56,
  style,
}) => {
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: size,
        color: colors.white,
        letterSpacing: "0.18em",
        ...style,
      }}
    >
      BITAXUS
    </div>
  );
};
