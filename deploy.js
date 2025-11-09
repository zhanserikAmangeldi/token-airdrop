import pkg from "hardhat";
import dotenv from "dotenv";

dotenv.config();

const { ethers } = pkg;

async function main() {
  const [deployer, a1, a2, a3] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const MyToken = await ethers.getContractFactory("Token");
  const token = await MyToken.deploy("AAA-Team", "AAA");

  await token.waitForDeployment();

  console.log("Token deployed:", await token.getAddress());

  const mintAmount = ethers.parseUnits("1000000", 18); 
  await token.connect(deployer).mint(await deployer.getAddress(), mintAmount);
  console.log("Minted to deployer");

  const Airdrop = await ethers.getContractFactory("Airdrop");
  const airdrop = await Airdrop.deploy(await token.getAddress());

  await airdrop.waitForDeployment();

  console.log("Airdrop deployed:", await airdrop.getAddress());

  await token.connect(deployer).approve(await airdrop.getAddress(), ethers.parseUnits("100000", 18));
  console.log("Approved Airdrop to spend deployer tokens");



  const recipients = [await a1.getAddress(), await a2.getAddress()]; 
  const amounts = [
    ethers.parseUnits("1000", 18),
    ethers.parseUnits("2000", 18)
  ];

  const tx = await airdrop.connect(deployer).multisendFromOwner(recipients, amounts);
  await tx.wait();
  console.log("Multisend executed to:", recipients);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});