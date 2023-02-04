import React from "react";
import styles from "./image.module.css";

type ImageProps = {
  source: string;
  alt?: string;
  className?: string;
};

const SquareImage = ({
  source,
  alt = "",
  className,
}: ImageProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <img src={source} alt={alt} className={className} />
    </div>
  );
};

export default SquareImage;
