import React from "react";
import styles from "./button.module.css";

type ButtonProps = {
  type: "rectangle" | "square";
  onButtonClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

const Button = ({
  type,
  onButtonClick,
  className,
  children,
}: ButtonProps): JSX.Element => {
  return (
    <button
      onClick={onButtonClick}
      className={`${styles.button} ${styles[`type--${type}`]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
