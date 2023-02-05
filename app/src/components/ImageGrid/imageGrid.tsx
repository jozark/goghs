import { Nft } from "@metaplex-foundation/js";
import { useEffect, useState } from "react";
import { getImageUrl } from "../../services/images.services";
import LoadingSpinner from "../LoadingSpinner/loadingSpinner";
import styles from "./imageGrid.module.css";

type ImageGridProps = {
  nfts: Nft[];
  selectedImage: Nft | undefined;
  selectImage: (nft: Nft, url: string) => void;
};

const ImageGrid = ({ nfts, selectedImage, selectImage }: ImageGridProps) => {
  const [images, setImages] = useState<Map<Nft, string | null>>(new Map());

  useEffect(() => {
    nfts.forEach((nft) => {
      getImageUrl(nft).then((url) => {
        setImages((prevImages) => {
          const newImages = new Map(prevImages);
          newImages.set(nft, url);
          return newImages;
        });
      });
    });
  }, []);

  return (
    <div className={styles.container}>
      {Array.from(images.entries()).map(([nft, image]) => {
        return image ? (
          <div
            key={image}
            className={styles.nft}
            style={{ border: "1px solid black" }}
          >
            <img src={image} alt="" onClick={() => selectImage(nft, image)} />
            <p>{nft.name}</p>
          </div>
        ) : (
          <h1 key={nft.address.toString()}>🐶</h1>
        );
      })}
    </div>
  );
};

export default ImageGrid;
