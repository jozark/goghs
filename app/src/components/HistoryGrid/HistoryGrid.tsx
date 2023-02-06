import { Nft, NftWithToken } from "@metaplex-foundation/js";
import { NftWithUrl } from "../../types";
import styles from "./historyGrid.module.css";
import { hostname } from "os";

type HistoryGridProps = {
    nftWithUrl: NftWithToken | null | undefined;
};

const HistoryGrid = ({ nftWithUrl }: HistoryGridProps) => {

    console.log(nftWithUrl)
    const history = nftWithUrl?.json?.properties?.history as (Array<string> | null)

    return (
        <div className={styles.container}>
            {history ? history.map((url) => {
                return (
                    <div
                        key={url}
                        className={styles.nft}
                    >
                        <img
                            src={url}
                            alt=""
                        />
                    </div>
                )
            }) : <div>Penis</div>}

        </div>
    );
};

export default HistoryGrid;
