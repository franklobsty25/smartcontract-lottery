const { network, ethers } = require('hardhat');
const {
  developmentChains,
  networkConfig,
} = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

const VRF_SUB_FUND_AMOUNT = ethers.parseEther('2');
const BASE_FEE = ethers.parseEther('2.0'); // 2.0 is the premium. It costs 2 LIMIT per gas tansaction
const GAS_PRICE_LINK = 1e9; // 1000000000

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  if (developmentChains.includes(network.name)) {
    // const vrfCoordinatorV2Mock = await deployments.get(
    //   'VRFCoordinatorV2Mock'
    // );
    const vrfCoordinatorV2Mock = await ethers.deployContract(
      'VRFCoordinatorV2Mock',
      [BASE_FEE, GAS_PRICE_LINK]
    );
    await vrfCoordinatorV2Mock.waitForDeployment();
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target;
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    // subscriptionId = transactionReceipt.events[0].args.subId;
    subscriptionId = networkConfig[chainId]['subscriptionId']
    // Fund the subscription
    // Usually, you'd need the link token on a real network
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
    return;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]['vrfCoordinatorV2'];
    subscriptionId = networkConfig[chainId]['subscriptionId'];
  }

  const entranceFee = networkConfig[chainId]['entranceFee'];
  const gasLane = networkConfig[chainId]['gasLane'];
  const callbackGasLimit = networkConfig[chainId]['callbackGasLimit'];
  const interval = networkConfig[chainId]['interval'];

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];
  // const raffle = await deploy('Raffle', {
  //   from: deployer,
  //   args,
  //   log: true,
  //   waitConfirmations: network.config.blockConfirmations || 1,
  // });
  const raffle = await ethers.deployContract('Raffle', args);
  await raffle.waitForDeployment();

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log('Verify...');
    await verify(raffle.target, args);
  }

  console.log('----------------------------------------------------------------');
};

module.exports.tags = ['all', 'raffle'];
