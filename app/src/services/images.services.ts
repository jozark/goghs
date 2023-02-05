import { Nft } from "@metaplex-foundation/js";

export async function getImageUrl(nft: Nft): Promise<string> {
  //todo error handling
  const response = await fetch(nft.uri);
  const data = await response.json();
  return data.image;
}

export async function getVariation(url: string): Promise<any> {
  const response = await fetch("http://localhost:3001/api/getImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageurl: url,
    }),
  });

  const { file } = await response.json();
  return file;
}
