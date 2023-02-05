import {
  bundlrStorage,
  keypairIdentity,
  Metaplex,
  Nft,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import ImageGrid from "./components/ImageGrid/imageGrid";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import secret from "./devnet.json";
import { getImageUrl, getVariation } from "./services/images.services";
require("@solana/wallet-adapter-react-ui/styles.css");

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const wallets = [new PhantomWalletAdapter()];
const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const metaplex = new Metaplex(connection);
metaplex.use(keypairIdentity(WALLET));
metaplex.use(
  bundlrStorage({
    address: "https://devnet.bundlr.network",
    providerUrl: "https://api.devnet.solana.com",
    timeout: 60000,
  })
);

const COLLECTIONADDRESS = "3giiZPDeHYLwLzXbRrJpixF6k61zALoSvR5gRjFq4UP9";

const CONFIG = {
  imgType: "image/png",
  imgName: "QuickPix New MetaName",
  description: "New description!",
  attributes: [
    { trait_type: "Speed", value: "Quicker" },
    { trait_type: "Type", value: "Pixelated" },
    { trait_type: "Background", value: "QuickNode Blue 2" },
  ],
};

function App() {
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletPub, setWalletPub] = useState<PublicKey | null>(null);
  //TODO fix any
  const [selectedNFT, setSelectedNFT] = useState<{ nft: any; url: string }>();
  const [collectionNFTs, setCollectionNFTs] = useState<Nft[]>([]);

  useEffect(() => {
    if ((wallet as any).connected) {
      setWalletPub(wallet.publicKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    const startFindNft = async () => {
      if (walletPub) {
        await findNft();
      }
    };
    startFindNft();
  }, [walletPub]);

  const findNft = async () => {
    if (!walletPub) {
      return;
    }

    const owner = walletPub;

    const allNFTs = await metaplex.nfts().findAllByOwner({ owner });
    const collectionNFTs: any = allNFTs.filter(
      (nft) => nft.collection?.address.toString() === COLLECTIONADDRESS
    );

    //handle what to do if found
    if (collectionNFTs.length > 0) {
      const url = await getImageUrl(collectionNFTs[0]);
      setSelectedNFT({ nft: collectionNFTs[0], url });
      setCollectionNFTs(collectionNFTs);
    }
  };

  const createNft = async () => {
    const newUri = await updateMetadata(
      "https://media.discordapp.net/attachments/913148795632631838/1071416205203734579/8304.png?width=685&height=685"
    );
    const { nft } = await metaplex.nfts().create({
      uri: newUri,
      name: "My NFT",
      sellerFeeBasisPoints: 500,
    });

    const { uri } = await metaplex.nfts().uploadMetadata({
      ...nft.json,
      name: "TAREK",
      description: "My Updated Metadata Description",
    });

    const updatedNft = await metaplex.nfts().update({
      nftOrSft: nft,
      uri,
    });
    console.log(uri, "this is the uri");
    console.log(updatedNft, "this is the updated NFT");
    console.log(nft, "🎉 Hat geklappt atze");
  };

  const handleButtonClick = async () => {
    setIsLoading(true);
    if (selectedNFT?.url) {
      const newImageFile = await getVariation(selectedNFT.url);
      console.log(newImageFile, "newImageFile");

      const test = selectedNFT?.nft.mintAddress.toString();
      const mintAddress = new PublicKey(test);
      const nfttest = await metaplex.nfts().findByMint({ mintAddress });
      let uri;
      setIsLoading(false);
      try {
        // TODO FAILING HERE BECAUS SIZE IS NOT AN INTEGER
        const metadata = await metaplex.nfts().uploadMetadata({
          ...selectedNFT.nft.json,
          name: "GIGBSBSF",
          description: "My Updated Metadata Description",
          image: newImageFile,
        });
        uri = metadata.uri;
      } catch (err) {
        console.log(err, "failed bro");
      }

      console.log(uri, "this is the new metadatas");

      const updatedNft = await metaplex.nfts().update({
        nftOrSft: nfttest,
        uri,
      });
      console.log(updatedNft, "we did it");
    }
  };

  const handleSelectedClick = (nft: any, url: string) => {
    setSelectedNFT({ nft, url });
  };

  const updateMetadata = async (url: string) => {
    const uri = uploadMetadata(
      url,
      CONFIG.imgType,
      CONFIG.imgName,
      CONFIG.description,
      CONFIG.attributes
    );
    return uri;
  };

  async function uploadMetadata(
    imgUri: string,
    imgType: string,
    nftName: string,
    description: string,
    attributes: { trait_type: string; value: string }[]
  ) {
    const { uri } = await metaplex.nfts().uploadMetadata({
      name: nftName,
      description: description,
      image: imgUri,
      attributes: attributes,
      properties: {
        files: [
          {
            type: imgType,
            uri: imgUri,
          },
        ],
      },
    });
    return uri;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a className={styles.logo} href="http://localhost:3000/">
          Goghs
        </a>
        <WalletMultiButton />
      </header>
      {!(wallet as any).connected ? (
        <h2>Connecte dein Wallet du Hund 🐶</h2>
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.collectionWrapper}>
            <ImageGrid
              nfts={collectionNFTs}
              selectedImage={selectedNFT?.nft}
              selectImage={(nft, url) => handleSelectedClick(nft, url)}
            />
          </div>
          <div className={styles.container}>
            {isLoading || !selectedNFT ? (
              <LoadingSpinner />
            ) : (
              <>
                <Image source={selectedNFT?.url || ""} alt="" />
                <div>{selectedNFT?.nft?.name || "not available"}</div>
              </>
            )}
            <Button type="rectangle" onButtonClick={handleButtonClick}>
              Reimagine
            </Button>
            <Button type="rectangle" onButtonClick={createNft}>
              create me daddy
            </Button>
          </div>
        </div>
      )}
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
