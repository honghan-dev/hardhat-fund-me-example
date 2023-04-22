const { network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	let ethUsdPriceFeedAddress;
	if (chainId == 31337) {
		const ethUsdAggreagtor = await deployments.get("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggreagtor.address;
	} else {
		ethUsdPriceFeedAddress = networkConfig?.[chainId]?.["ethUsdPriceFeed"];
	}
	log("----------------------------------------------------");
	log("Deploying FundMe and waiting for confirmations...");

	// MockV3Aggregator is only deployed on local networks
	const args = [ethUsdPriceFeedAddress];
	const fundMe = await deploy("FundMe", {
		from: deployer,
		args: args,
		log: true,
	});

	if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
		console.log("Verifying contract on Etherscan...");
		await verify(fundMe.address, args);
	} else {
		console.log("Can't verify on local environment");
	}
};

module.exports.tags = ["all", "fundme"];
