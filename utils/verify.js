const hre = require("hardhat");

const verify = async (contractAddress, args) => {
	console.log("Verifying contract...");
	try {
		await hre.run("verify:verify", {
			address: contractAddress,
			constructorArguments: args,
		});
	} catch (error) {
		if (error.message.includes("Contract source code already verified")) {
			console.log("Contract source code already verified");
		} else {
			console.log(error);
		}
	}
};

module.exports = { verify };
