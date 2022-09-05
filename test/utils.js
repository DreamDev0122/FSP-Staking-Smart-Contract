const { network } = require("hardhat");

const rpc = ({ method, params }) => {
  return network.provider.send(method, params);
};

const increaseTime = async (seconds) => {
  await rpc({ method: "evm_increaseTime", params: [seconds] });
  return rpc({ method: "evm_mine" });
};
