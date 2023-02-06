import { NftWithToken } from "@metaplex-foundation/js";
import Button from "../Button/button";

import styles from "./historyGrid.module.css";

type HistoryGridProps = {
  nftWithToken: NftWithToken | null | undefined;
  onChooseEvolution: (evolutionIndex: number) => void;
};

const HistoryGrid = (props: HistoryGridProps) => {
  const history = props.nftWithToken?.json?.properties
    ?.history as Array<string> | null;
  const attributes = props.nftWithToken?.json?.attributes;

  if (!history || !attributes) return <p>no history found</p>;

  const currentEvolution = Number(
    (attributes as Array<any>)[0].value as string
  );

  return (
    <div className={styles.container}>
      {history.map((url, index) => {
        return (
          <div key={url} className={styles.nft}>
            <img src={url} alt="" />
            {currentEvolution == index || (
              <Button
                type="rectangle"
                onButtonClick={() => props.onChooseEvolution(index)}
              >
                Reset
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HistoryGrid;
