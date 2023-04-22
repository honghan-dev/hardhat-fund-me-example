const { deployments, getNamedAccounts, ethers } = require("hardhat");
const { expect, assert } = require("chai");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", () => {
			let fundMe;
			let deployer;
			let mockV3Aggregator;

			const sendValue = ethers.utils.parseEther("1.0");

			beforeEach(async () => {
				// Get signers provided in the hardhat.config.js or
				// 10 fake accounts from hardhat
				// const accounts = await ethers.getSigners();

				// get the deployer
				deployer = (await getNamedAccounts()).deployer;
				// use the fixture to deploy the contracts
				await deployments.fixture(["all"]);
				// get the FundMe contract
				fundMe = await ethers.getContract("FundMe", deployer);
				// get the MockV3Aggregator contract
				mockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				);
			});

			describe("constructor", async () => {
				it("Set the aggregator addresses correctly", async () => {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, mockV3Aggregator.address);
				});
			});

			describe("fund", async () => {
				it("Should revert if the amount is less than 10", async () => {
					await expect(fundMe.fund()).to.be.revertedWith(
						"You need to spend some ETH"
					);
				});

				it("Update the amount funded", async () => {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(deployer);
					assert.equal(response.toString(), sendValue.toString());
				});

				it("Adds funder to array of funders", async () => {
					await fundMe.fund({ value: sendValue });
					const funder = await fundMe.getFunder(0);
					assert.equal(funder, deployer);
				});
			});

			describe("withdraw", async () => {
				beforeEach(async () => {
					await fundMe.fund({ value: sendValue });
				});

				it("Should withdraw the funds", async () => {
					// Arrange
					// Get the starting balance of the contract and the deployer
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					// Act
					// Withdraw the funds from the contract
					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;

					// Calculate the gas cost of the transaction
					const gasCost = gasUsed.mul(effectiveGasPrice);

					// Get the ending balance of the contract and the deployer
					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					// Assert
					// Assert that the contract balance is zero
					assert.equal(endingFundMeBalance, 0);
					// Assert that the deployer's balance is the same as
					assert.equal(
						startingFundMeBalance.add(startingDeployerBalance),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				it("Cheaper withdrawal", async () => {
					// Arrange
					// Get the starting balance of the contract and the deployer
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					// Act
					// Withdraw the funds from the contract
					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;

					// Calculate the gas cost of the transaction
					const gasCost = gasUsed.mul(effectiveGasPrice);

					// Get the ending balance of the contract and the deployer
					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					// Assert
					// Assert that the contract balance is zero
					assert.equal(endingFundMeBalance, 0);
					// Assert that the deployer's balance is the same as
					assert.equal(
						startingFundMeBalance.add(startingDeployerBalance),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				it("Should revert if the sender is not the owner", async () => {
					const accounts = await ethers.getSigners();
					const attacker = accounts[1];
					const attackerConnectedContract = await fundMe.connect(attacker);
					await expect(
						attackerConnectedContract.withdraw()
					).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
				});

				it("Multiple funders withdrawal", async () => {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						// Deployer is the current connected account, this functions onnect the accounts to the contract
						const fundMeConnectedContract = await fundMe.connect(accounts[i]);

						await fundMeConnectedContract.fund({ value: sendValue });
					}

					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					// Act
					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;

					// Calculate the gas cost of the transaction
					const gasCost = gasUsed.mul(effectiveGasPrice);

					await expect(fundMe.getFunder(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(accounts[i].address),
							0
						);
					}
				});
			});
	  });
