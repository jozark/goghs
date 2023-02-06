import { Nft } from "@metaplex-foundation/js";
import { useEffect, useState } from "react";
import { getImageUrl } from "../../services/images.services";
import styles from "./imageGrid.module.css";

type ImageGridProps = {
  nfts: Nft[];
  selectedImage: Nft | undefined;
  selectImage: (nft: Nft, url: string) => void;
};

// TODO
// lift logic to app component
// will fix the missing collectionNft container after reload
// + makes map of <nft, nftImage> available for the app component

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
            key={nft.address.toString()}
            className={styles.nft}
            style={{
              border: `${
                nft === selectedImage ? "3px solid red" : "1px solid black"
              }`,
            }}
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
