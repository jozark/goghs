import { Nft, PublicKey } from "@metaplex-foundation/js";

export async function getImageUrl(nft: Nft): Promise<string> {
  //todo error handling
  const response = await fetch(nft.uri);
  const data = await response.json();
  return data.image;
}

/// returns true if successfull
export async function requestVariationAndMetadataUpdate(
  mintAddress: PublicKey,
  endpoint: string,
  evolution: number, // TODO this only makes sense for the reset endpoint; needs refactor
): Promise<boolean> {
  const response = await fetch(`http://localhost:3001/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mintAddress: mintAddress,
      evolution: evolution,
      // new
      nft_address: mintAddress,
      index_path: [0],
    }),
  });
  return response.status == 200;
}
