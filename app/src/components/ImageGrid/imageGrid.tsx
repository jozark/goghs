import { Nft } from "@metaplex-foundation/js";
import { NftWithUrl } from "../../types";
import styles from "./imageGrid.module.css";

type ImageGridProps = {
  nftsWithUrl: NftWithUrl[];
  selectedNft: Nft | undefined;
  selectNft: (nftWithUrl: NftWithUrl) => void;
};

const ImageGrid = ({ nftsWithUrl, selectedNft, selectNft }: ImageGridProps) => {
  return (
    <div className={styles.container}>
      {nftsWithUrl.map((nftWithUrl) => {
        return nftWithUrl.url ? (
          <div
            key={nftWithUrl.nft.address.toString()}
            className={styles.nft}
            style={{
              border: `${nftWithUrl.nft.address.toString() ===
                selectedNft?.address.toString()
                ? "3px solid red"
                : "1px solid black"
                }`,
            }}
          >
            <img
              src={nftWithUrl.url}
              alt=""
              onClick={() => selectNft(nftWithUrl)}
            />
            <p>{nftWithUrl.nft.name}</p>
          </div>
        ) : (
          <h1 key={nftWithUrl.nft.address.toString()}>🐶</h1>
        );
      })}
    </div>
  );
};

export default ImageGrid;
