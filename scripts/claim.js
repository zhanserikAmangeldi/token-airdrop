import pkg from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import fs from "fs";
const { ethers } = pkg;

async function main() {
  const provider = ethers.getDefaultProvider();
  const airdropJson = JSON.parse(fs.readFileSync("airdrop.json"));
  const airdropAddr = process.env.AIRDROP;
  if (!airdropAddr) { console.error("Set AIRDROP env var"); return; }

  const airdropAddress = ethers.getAddress(airdropAddr);

  const airdrop = await ethers.getContractAt("Airdrop", airdropAddress);

  const signers = await ethers.getSigners();
  const entry = airdropJson.entries[2];
  const claimant = signers.find(s => s.address.toLowerCase() === entry.address.toLowerCase());
  if (!claimant) { console.error("Claimant signer not found in local accounts", entry.address); return; }

  console.log("Claiming for", claimant.address, "amount", entry.amount);
  const tx = await airdrop.connect(claimant).claim(entry.index, entry.address, entry.amount, entry.proof);
  
  await tx.wait();
  console.log("Claim tx done", tx.hash);
}

main().catch(console.error);
