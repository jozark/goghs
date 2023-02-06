import { JsonMetadata, Metadata, Nft, Sft } from "@metaplex-foundation/js";

export type MetaDataOrNft = Metadata<JsonMetadata<string>> | Nft | Sft;

export interface NftWithUrl {
  nft: MetaDataOrNft;
  url: string;
}
