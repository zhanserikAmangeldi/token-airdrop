import pkg from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import fs from "fs";
const { ethers } = pkg;

async function main() {
  const signers = await ethers.getSigners();
  console.log("Using signers:");
  signers.forEach((s, i) => {
    console.log(`  [${i}]: ${s.address}`);
  });

  const entries = [
    { index: 0, address: signers[1].address, amount: ethers.parseUnits("500", 18).toString() },
    { index: 1, address: signers[2].address, amount: ethers.parseUnits("1500", 18).toString() },
    { index: 2, address: signers[3].address, amount: ethers.parseUnits("250", 18).toString() }
  ];

  const leaves = entries.map(e => Buffer.from(ethers.solidityPackedKeccak256(["uint256","address","uint256"], [e.index, e.address, e.amount]).slice(2), 'hex'));

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const root = tree.getHexRoot();
  console.log("Merkle Root:", root);

  const data = entries.map((e, i) => {
    const leaf = Buffer.from(ethers.solidityPackedKeccak256(["uint256","address","uint256"], [e.index, e.address, e.amount]).slice(2), 'hex');
    const proof = tree.getHexProof(leaf);
    return { index: e.index, address: e.address, amount: e.amount, proof };
  });

  const out = {
    merkleRoot: root,
    entries: data
  };

  fs.writeFileSync("airdrop.json", JSON.stringify(out, null, 2));
  console.log("Wrote airdrop.json");
}

main().catch(console.error);
