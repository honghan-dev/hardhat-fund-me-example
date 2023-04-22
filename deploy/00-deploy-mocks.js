const { network } = require("hardhat");
const { DECIMAL, INITIAL_PRICE } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	if (chainId == 31337) {
		log("Local network detected! Deploying mocks");
		await deploy("MockV3Aggregator", {
			contract: "MockV3Aggregator",
			from: deployer,
			log: true,
			args: [DECIMAL, INITIAL_PRICE],
		});
		log("Mocks deployed!");
		log("---------------------");
	}
};

module.exports.tags = ["all", "mocks"];
