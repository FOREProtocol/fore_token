import { ethers, network } from 'hardhat';

async function main() {
  const FOREProtocol = await ethers.getContractFactory('FOREProtocol');
  const foreProtocol = await FOREProtocol.deploy();

  await foreProtocol.deployed();

  console.log(
    `FOREProtocol Token deployed to ${foreProtocol.address} on ${network.name}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
