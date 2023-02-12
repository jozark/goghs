import {
  FindNftsByOwnerOutput,
  Metadata,
  Metaplex,
  Nft,
} from "@metaplex-foundation/js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  useWallet,
  WalletContextState,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import assert from "assert";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import ImageGrid from "./components/ImageGrid/imageGrid";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import {
  getImageUrl,
  requestVariationAndMetadataUpdate,
} from "./services/images.services";
import { MetaDataOrNft, NftWithUrl } from "./types";
require("@solana/wallet-adapter-react-ui/styles.css");

// ========================================================================================================
const COLLECTIONADDRESS = "4PVaRRoCybCJSfmkobCe4oUhXjUyksrMT7h9TzXYncjn";
const REFRESH_STATE_ON_PAGE_RELOAD = true;
const NETWORK_TYPE = WalletAdapterNetwork.Devnet;

// ========================================================================================================

// phantom wallet adapter
const wallets = [new PhantomWalletAdapter()];

// set up connection to chain
const endpoint = clusterApiUrl(NETWORK_TYPE);
const connection = new Connection(endpoint, "confirmed");
const metaplex = new Metaplex(connection);

function App() {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NftWithUrl | null>();
  const [collectionNFTs, setCollectionNFTs] = useState<NftWithUrl[]>([]);

  useEffect(() => {
    console.log("=============================")
    window.parent.addEventListener('message', (event) => {
      const data = event.data;

      try {
        const json = JSON.parse(data);
        if (json) {
          if (json["msg_id"] == "create_new") {
            const indexPath = json["index_path"];
            console.log("create new ", indexPath);
            return;
          }
          if (json["msg_id"] == "set_cover") {
            const indexPath = json["index_path"];
            console.log("set cover ", indexPath);
            return;
          }

        }
      } catch {
        //
      }
    }, false);
  }, []);

  // set publicKey as state as soon as client connects with phantom
  useEffect(() => {
    if ((wallet as WalletContextState).connected) {
      setWalletPub(wallet.publicKey);
    }
  }, [wallet]);

  /// Return all nfts from our collection if any.
  ///
  /// Expects [walletPub] to be present
  const getCollectionNfts = async (): Promise<Array<MetaDataOrNft>> => {
    assert(walletPub);

    const allNfts: FindNftsByOwnerOutput = await metaplex
      .nfts()
      .findAllByOwner({ owner: walletPub });
    return allNfts.filter(
      (nft: MetaDataOrNft) =>
        nft.collection?.address.toString() === COLLECTIONADDRESS
    );
  };

  /// If we have a wallet connected, get NFTs from our collection and select first
  const fetchCollectionAndSetSelected = async (nftWithUrl: NftWithUrl | null) => {
    if (!walletPub) return;

    const collectionNfts = await getCollectionNfts();
    // TODO handle what to do if no collection nft found
    if (collectionNfts.length > 0) {
      // cast to nfts
      const nfts = collectionNfts as Nft[];

      // fetch images for all nfts
      const collectionNftsWithImages: { nft: Nft; url: string }[] =
        await Promise.all(
          nfts.map(async (nft) => {
            return {
              nft,
              url: await getImageUrl(nft),
            };
          })
        );
      setCollectionNFTs(collectionNftsWithImages);

      let _selectedNft: MetaDataOrNft;
      let fireUpdate;
      if (nftWithUrl) {
        _selectedNft = nftWithUrl.nft;
        fireUpdate = () => setSelectedNFT(nftWithUrl);
      } else {


        if (!selectedNFT) {
          _selectedNft = collectionNfts[0];
        } else {
          _selectedNft = nfts.find(
            (nft) => nft.address.toString() == selectedNFT.nft.address.toString()
          ) as Nft;
        }
        if (!_selectedNft) return;
        const url = await getImageUrl(_selectedNft as Nft);

        fireUpdate = () => setSelectedNFT({ nft: _selectedNft, url });
      }



      const metadata = await metaplex
        .nfts()
        .findByMint({ mintAddress: new PublicKey((_selectedNft as Metadata).mintAddress.toString()) });

      const iframe = document.getElementById('flutter') as HTMLIFrameElement;
      iframe.contentWindow?.postMessage(
        {
          msg_id: "select_nft",
          metadata: metadata?.json?.properties?.history || {
            focusIndex: 0,
            visiblePath: [0],
            rootImages: {
              // wtf JS wtf is this shit, you seriously want me to put brackets here you fucking ass clown
              [metadata?.json?.image || ""]: {},
            }
          },
        },
        "*"
      );

      fireUpdate();

    }
  };

  // Reload on page refresh // TODO this is mainly for development, not sure if we need this in PROD
  if (REFRESH_STATE_ON_PAGE_RELOAD) {
    useEffect(() => {
      fetchCollectionAndSetSelected(null);
    }, []);
  }
  // Reload once the wallet is connected (or disconnected, but we exit early in that case)
  useEffect(() => {
    fetchCollectionAndSetSelected(null);
  }, [walletPub]);

  // TODO refactor again, we only need the evolution for the reset param
  const handleAlterImageClick = async (endpoint: string, evolution: number) => {
    if (!selectedNFT?.url) return;

    setIsLoading(true);

    const mintAddress = new PublicKey(
      (selectedNFT?.nft as Metadata).mintAddress.toString()
    );

    const success = await requestVariationAndMetadataUpdate(
      mintAddress,
      endpoint,
      evolution,
    );

    if (!success) return; // TODO maybe show a small error snackbar?

    // TODO not sure if we need this
    await fetchCollectionAndSetSelected(null);
    setIsLoading(false);
  };

  const handleSelectedClick = (nftWithUrl: NftWithUrl) => {
    fetchCollectionAndSetSelected(nftWithUrl)
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>
      {!wallet.connected ? (
        <h2>Connecte dein Wallet du Hund 🐶</h2>
      ) : (
        <div className={styles.container}>
          <div className={styles.collectionNfts}>
            <div><h2>Wallet</h2></div>
            <ImageGrid
              nftsWithUrl={collectionNFTs}
              selectedNft={selectedNFT?.nft as Nft | undefined}
              selectNft={(nft) => handleSelectedClick(nft)}
            />
          </div>

          <div className={styles.selectedNft}>
            <div><h2>{selectedNFT?.nft?.name}</h2></div>

            {isLoading || !selectedNFT ? (
              <LoadingSpinner />
            ) : (
              <>
                <Image source={selectedNFT?.url} alt="" />
              </>
            )}

            <div className={styles.buttonsContainer}>
              <Button
                type="rectangle"
                onButtonClick={() => handleAlterImageClick("api/getImage", -1)}
              >
                Reimagine
              </Button>

            </div>
          </div>
        </div>
      )}
      <iframe width="90%" height="800px" id="flutter" src="flutter/index.html"></iframe>
    </div>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
