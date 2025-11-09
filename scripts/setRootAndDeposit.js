import pkg from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import fs from "fs";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  const tokenAddr = process.env.TOKEN;
  const airdropAddr = process.env.AIRDROP;

  if (!tokenAddr || !airdropAddr) {
    console.error("Set TOKEN and AIRDROP env variables");
    return;
  }

  const tokenAddress = ethers.getAddress(tokenAddr);
  const airdropAddress = ethers.getAddress(airdropAddr);

  const token = await ethers.getContractAt("Token", tokenAddress);
  const airdrop = await ethers.getContractAt("Airdrop", airdropAddress);

  const airdropJson = JSON.parse(fs.readFileSync("airdrop.json"));
  const root = airdropJson.merkleRoot;
  console.log("Root:", root);

  await (await airdrop.connect(deployer).setMerkleRoot(root)).wait();
  console.log("Merkle root set on contract");

  const total = airdropJson.entries.reduce((acc, e) => acc + BigInt(e.amount), BigInt(0));
  console.log("Total to deposit:", total.toString());

  await (await token.connect(deployer).transfer(await airdrop.getAddress(), total.toString())).wait();
  console.log("Deposited tokens to airdrop contract");
}

main().catch(console.error);
