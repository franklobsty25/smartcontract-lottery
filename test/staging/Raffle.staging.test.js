const { network, getNamedAccounts, deployments, ethers } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');
const { assert } = require('chai');

developmentChains.includes(network.name)
  ? describe.skip
  : describe('Raffle Unit Tests', () => {
      let raffle, raffleEntranceFee, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract('Raffle', deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe('fulfillRandomWords', () => {
        it('works with live Chainlink Keepers and Chainlink VRF, we get a random winner', async () => {
          // enter the raffle
          const startingTimeStamp = await raffle.getLatestTimeStamp();
          const accounts = await ethers.getSigners();

          await new Promise((resolve, reject) => {
            raffle.once('WinnerPicked', async () => {
              console.log('WinnerPicked event fired!');
              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const winnerEndingBalance = await accounts[0].getBalance();
                const endingTimeStamp = await raffle.getLatestTimeStamp();

                await expect(raffle.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(raffleState, 0);
                assert.equal(
                  winnerEndingBalance.toString(),
                  winningStartingBalance.add(raffleEntranceFee).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (error) {
                console.error(error);
                reject(error);
              }
            });
          });
          // Then entering the raffle
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const winnerStartingBalance = await accounts[0].getBalance();

          // and this code WONT complete untill our listener has finsihed listening!
        });
      });
    });
