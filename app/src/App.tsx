import {
  FindNftsByOwnerOutput,
  Metadata,
  Metaplex,
  Nft,
  NftWithToken,
  toPublicKey,
} from "@metaplex-foundation/js";
import { AnchorProvider } from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
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
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import assert from "assert";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import HistoryGrid from "./components/HistoryGrid/HistoryGrid";
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
const COLLECTIONADDRESS = "ByQ8WvACSDQpTRqULkHEJHUB3cbU6jtyHH7qPrsJdvbx";
const REFRESH_STATE_ON_PAGE_RELOAD = true;
const NETWORK_TYPE = WalletAdapterNetwork.Devnet;

// ========================================================================================================

// phantom wallet adapter
const wallets = [new PhantomWalletAdapter()];

// set up connection to chain
const clusterEndpoint = clusterApiUrl(NETWORK_TYPE);

function App() {
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NftWithUrl | null>();
  const [selectedMetadata, setSelectedMetadata] = useState<
    NftWithToken | null | undefined
  >();
  const [collectionNFTs, setCollectionNFTs] = useState<NftWithUrl[]>([]);

  // set publicKey as state as soon as client connects with phantom
  useEffect(() => {
    if ((wallet as WalletContextState).connected) {
      setWalletPub(wallet.publicKey);
    }
  }, [wallet]);

  // Reload on page refresh // TODO this is mainly for development, not sure if we need this in PROD
  if (REFRESH_STATE_ON_PAGE_RELOAD) {
    useEffect(() => {
      fetchCollectionAndSetSelected();
    }, []);
  }
  // Reload once the wallet is connected (or disconnected, but we exit early in that case)
  useEffect(() => {
    fetchCollectionAndSetSelected();
  }, [walletPub]);

  const getProvider = (): AnchorProvider => {
    const connection = new Connection(clusterEndpoint, "processed");
    const provider = new AnchorProvider(connection, wallet as Wallet, {
      preflightCommitment: "processed",
    });
    return provider;
  };

  const getMetaplexConnection = (): Metaplex => {
    const connection = new Connection(clusterEndpoint, "confirmed");
    const metaplex = new Metaplex(connection);
    return metaplex;
  };

  const sendTransaction = async (solAmount: number): Promise<boolean> => {
    try {
      const connection = new Connection(clusterEndpoint, "processed");
      const provider = getProvider();

      if (!provider.wallet.publicKey) throw new WalletNotConnectedError();

      const txn = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: toPublicKey("9RKaq2srT5eewGo7DkGVXfkmr1eBser2VGLa37b65JKN"),
          lamports: solAmount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await wallet.sendTransaction(txn, connection);

      const latestBlockHash = await connection.getLatestBlockhash();

      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature,
      });
      return true;
    } catch (e) {
      console.log("transaction failed", e);
      return false;
    }
  };
  /// Return all nfts from our collection if any.
  ///
  /// Expects [walletPub] to be present
  const getCollectionNfts = async (): Promise<Array<MetaDataOrNft>> => {
    assert(walletPub);

    const metaplex = getMetaplexConnection();
    const allNfts: FindNftsByOwnerOutput = await metaplex
      .nfts()
      .findAllByOwner({ owner: walletPub });
    return allNfts.filter(
      (nft: MetaDataOrNft) =>
        nft.collection?.address.toString() === COLLECTIONADDRESS
    );
  };

  /// If we have a wallet connected, get NFTs from our collection and select first
  const fetchCollectionAndSetSelected = async (
    nftWithUrl?: NftWithUrl | null
  ) => {
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

      // TODO refactor. m monkey brain can not follow
      let _selectedNft;
      if (nftWithUrl) {
        _selectedNft = nftWithUrl.nft;
        setSelectedNFT(nftWithUrl);
      } else {
        if (!selectedNFT) {
          _selectedNft = collectionNfts[0];
        } else {
          _selectedNft = nfts.find(
            (nft) =>
              nft.address.toString() == selectedNFT.nft.address.toString()
          );
        }
        if (!_selectedNft) return;
        const url = await getImageUrl(_selectedNft as Nft);

        setSelectedNFT({ nft: _selectedNft, url });
      }

      const metaplex = getMetaplexConnection();
      const metdata = await metaplex.nfts().findByMint({
        mintAddress: new PublicKey(
          (_selectedNft as Metadata).mintAddress.toString()
        ),
      });

      setSelectedMetadata(metdata as NftWithToken);
    }
  };

  // TODO refactor again, we only need the evolution for the reset param
  const handleAlterImageClick = async (endpoint: string, evolution: number) => {
    if (!selectedNFT?.url || !walletPub) return;

    setIsLoading(true);

    const transactionSucceded = await sendTransaction(0.1);

    if (!transactionSucceded) {
      console.log("nice try bro 💀");
      setIsLoading(false);
      return;
    }

    const mintAddress = new PublicKey(
      (selectedNFT?.nft as Metadata).mintAddress.toString()
    );

    const success = await requestVariationAndMetadataUpdate(
      mintAddress,
      endpoint,
      evolution
    );

    if (!success) {
      setIsLoading(false);
      return;
    } // TODO maybe show a small error snackbar?

    // TODO not sure if we need this
    await fetchCollectionAndSetSelected();
    setIsLoading(false);
  };

  const handleSelectedClick = (nftWithUrl: NftWithUrl) => {
    fetchCollectionAndSetSelected(nftWithUrl);
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
          <div>
            <h2 className={styles.mb1p5}>Wallet</h2>
            <div className={styles.collectionNfts}>
              <ImageGrid
                nftsWithUrl={collectionNFTs}
                selectedNft={selectedNFT?.nft as Nft | undefined}
                selectNft={(nft) => handleSelectedClick(nft)}
              />
            </div>
          </div>

          <div className={styles.selectedNft}>
            <div>
              <h2>{selectedNFT?.nft?.name}</h2>
            </div>

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

          <div>
            <h2 className={styles.mb1p5}>History</h2>
            <div className={styles.collectionNfts}>
              <HistoryGrid
                nftWithToken={selectedMetadata as NftWithToken | undefined}
                onChooseEvolution={(i) =>
                  handleAlterImageClick("api/resetImage", i)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={clusterEndpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
