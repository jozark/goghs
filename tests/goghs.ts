import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Goghs } from "../target/types/goghs";

describe("goghs", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Goghs as Program<Goghs>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
