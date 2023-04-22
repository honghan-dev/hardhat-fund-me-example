const { getNamedAccounts, ethers, network } = require("hardhat");
const { expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", async () => {
			let fundMe;
			let deployer;
			const sendValue = ethers.utils.parseEther("1.0");

			beforeEach(async () => {
				// get the deployer
				deployer = (await getNamedAccounts()).deployer;

				// get the FundMe contract
				fundMe = await ethers.getContract("FundMe", deployer);
			});

			it("Allows people to fund and withdraw", async () => {
				await fundMe.fund({ value: sendValue });
				await fundMe.withdraw();
				const endingBalance = await fundMe.provider.getBalance(fundMe.address);

				assertHardhatInvariant.equal(endingBalance.toString(), 0);
			});
	  });
