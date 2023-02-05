import { useState, useEffect } from "react";
import styles from "./App.module.css";
import Button from "./components/Button/button";
import Image from "./components/Image/image";
import LoadingSpinner from "./components/LoadingSpinner/loadingSpinner";
import {
  Metaplex,
  keypairIdentity,
  divideAmount,
  Nft,
  Sft,
  BundlrStorageDriver,
  bundlrStorage,
} from "@metaplex-foundation/js";
import {
  Keypair,
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl } from "@project-serum/anchor";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletAdapterNetwork,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { getImageUrl, getVariation } from "./services/images.services";
import secret from "./devnet.json";
import ImageGrid from "./components/ImageGrid/imageGrid";
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
  const [walletpub, setwalletpub] = useState<String>();
  const [selectedNFT, setSelectedNFT] = useState<{ nft: any; url: string }>();
  const [collectionNFTs, setCollectionNFTs] = useState<Nft[]>([]);

  useEffect(() => {
    if ((wallet as any).connected) {
      setwalletpub(wallet.publicKey?.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    const startFindNft = async () => {
      if (walletpub) {
        await findNft();
      }
    };
    startFindNft();
  }, [walletpub]);

  const findNft = async () => {
    const owner = new PublicKey(walletpub as String);
    const COLLECTIONADDRESS = "3giiZPDeHYLwLzXbRrJpixF6k61zALoSvR5gRjFq4UP9";
    const MINTADDRESS = "CkUVLwrxFnMhKYkPoni5VNKum1WUBJ1aHjYspxQG3fdq";

    const myNfts = await metaplex.nfts().findAllByOwner({
      owner: metaplex.identity().publicKey,
    });

    const allNFTs = await metaplex.nfts().findAllByOwner({ owner });
    console.log(allNFTs)
     const collectionNFTs: any = allNFTs.filter(
       (nft) => nft.collection?.address.toString() === COLLECTIONADDRESS
     );

     console.log(collectionNFTs[0])
    
   // const collectionNFTs: any = allNFTs.filter((nft) => {
    //  return nft.address.toString() === MINTADDRESS;
    // });

    //handle what to do if found
    if (collectionNFTs.length > 0) {
      const url = await getImageUrl(collectionNFTs[0]);
      //test
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
      const newImageUrl = await getVariation(selectedNFT.url);
      //const mintAddress = new PublicKey("CkUVLwrxFnMhKYkPoni5VNKum1WUBJ1aHjYspxQG3fdq");
      const test = selectedNFT?.nft.mintAddress.toString()
      const mintAddress = new PublicKey(test)
      console.log(selectedNFT.nft)
      const nfttest = await metaplex.nfts().findByMint({ mintAddress });
      console.log(nfttest.json);

      setSelectedNFT({ nft: nfttest, url: newImageUrl });
      setIsLoading(false);
      console.log("Upload Metadata.")
      const { uri } = await metaplex.nfts().uploadMetadata({
        ...selectedNFT.nft.json,
        name: "GIGBSBSF",
        description: "My Updated Metadata Description",
        image: newImageUrl,
        files:
        [{
          uri:newImageUrl,
          type:"image/png"}]
      });
      console.log("done")
      console.log("Update NFT")
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
    console.log(`Step 2 - Uploading New MetaData`);

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
