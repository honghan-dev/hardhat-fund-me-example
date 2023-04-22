require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	// solidity: "0.8.17",
	solidity: {
		compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
	},
	defaultNetwork: "hardhat",
	networks: {
		goerli: {
			url: GOERLI_RPC_URL,
			accounts: [],
			chainId: 5,
		},
	},
	gasReporter: {
		enabled: true,
		outputFile: "gas-report.txt",
		noColors: true,
		currency: "USD",
		token: "MATIC",
	},
	namedAccounts: {
		deployer: {
			default: 0,
		},
	},
};
