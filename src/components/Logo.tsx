import React from "react";
import { Img, staticFile } from "remotion";

// Logo oficial de Bitaxus (public/logo.png, 796x152, blanco con contorno).
export const Logo: React.FC<{ width?: number; style?: React.CSSProperties }> = ({
  width = 300,
  style,
}) => {
  return (
    <Img
      src={staticFile("logo.png")}
      style={{ width, height: "auto", display: "block", ...style }}
    />
  );
};
