const { expect } = require('chai');
const { ethers } = require('hardhat');

// Start test block
describe('FOREProtocol Token', function () {
  before(async function () {
    this.FOREProtocolToken = await ethers.getContractFactory('FOREProtocol');
    this.expectedDecimals = '18';
    this.expectedName = 'FORE Protocol';
    this.expectedSymbol = 'FORE';
    // 1 Billion total supply
    this.expectedTotalSuppy = 1000000000;

    this.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  });

  beforeEach(async function () {
    this.foreToken = await this.FOREProtocolToken.deploy();
    await this.foreToken.deployed();

    this.decimals = await this.foreToken.decimals();

    const signers = await ethers.getSigners();

    this.ownerAddress = signers[0].address;
    this.recipientAddress = signers[1].address;

    this.signerContract = this.foreToken.connect(signers[1]);
  });

  // Test cases
  it(`Has the correct token name`, async function () {
    expect(await this.foreToken.name()).to.equal(this.expectedName);
  });

  it('Has the correct token symbol', async function () {
    expect(await this.foreToken.symbol()).to.equal(this.expectedSymbol);
  });

  it('Has the correct token decimals', async function () {
    expect((await this.foreToken.decimals()).toString()).to.equal(
      this.expectedDecimals
    );
  });

  it('Has the correct total supply', async function () {
    const expectedSupply = ethers.utils.parseUnits(
      this.expectedTotalSuppy.toString(),
      this.decimals
    );
    expect((await this.foreToken.totalSupply()).toString()).to.equal(
      expectedSupply
    );
  });

  it('Is able to query account balances', async function () {
    const ownerBalance = await this.foreToken.balanceOf(this.ownerAddress);
    expect(await this.foreToken.balanceOf(this.ownerAddress)).to.equal(
      ownerBalance
    );
  });

  it('Burn the right amount of tokens and change total supply', async function () {
    const tokenAmountToBurn = 1000;

    await expect(
      this.foreToken.burn(
        ethers.utils.parseUnits(tokenAmountToBurn.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Transfer')
      .withArgs(
        this.ownerAddress,
        this.ZERO_ADDRESS,
        ethers.utils.parseUnits(tokenAmountToBurn.toString(), this.decimals)
      );

    const expectedSupply = ethers.utils.parseUnits(
      (this.expectedTotalSuppy - tokenAmountToBurn).toString(),
      this.decimals
    );
    expect((await this.foreToken.totalSupply()).toString()).to.equal(
      expectedSupply
    );
  });

  it('Transfers the right amount of tokens to/from an account', async function () {
    const transferAmount = 1000;
    await expect(
      this.foreToken.transfer(this.recipientAddress, transferAmount)
    ).to.changeTokenBalances(
      this.foreToken,
      [this.ownerAddress, this.recipientAddress],
      [-transferAmount, transferAmount]
    );
  });

  it('Emits a transfer event with the right arguments', async function () {
    const transferAmount = 100000;
    await expect(
      this.foreToken.transfer(
        this.recipientAddress,
        ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Transfer')
      .withArgs(
        this.ownerAddress,
        this.recipientAddress,
        ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
      );
  });

  it('Allows for allowance approvals and queries', async function () {
    const approveAmount = 10000;
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(approveAmount.toString(), this.decimals)
    );
    expect(
      await this.foreToken.allowance(this.recipientAddress, this.ownerAddress)
    ).to.equal(
      ethers.utils.parseUnits(approveAmount.toString(), this.decimals)
    );
  });

  it('Emits an approval event with the right arguments', async function () {
    const approveAmount = 10000;
    await expect(
      this.signerContract.approve(
        this.ownerAddress,
        ethers.utils.parseUnits(approveAmount.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Approval')
      .withArgs(
        this.recipientAddress,
        this.ownerAddress,
        ethers.utils.parseUnits(approveAmount.toString(), this.decimals)
      );
  });

  it('Allows an approved spender to transfer from owner', async function () {
    const transferAmount = 10000;
    await this.foreToken.transfer(
      this.recipientAddress,
      ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
    );
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
    );
    await expect(
      this.foreToken.transferFrom(
        this.recipientAddress,
        this.ownerAddress,
        transferAmount
      )
    ).to.changeTokenBalances(
      this.foreToken,
      [this.ownerAddress, this.recipientAddress],
      [transferAmount, -transferAmount]
    );
  });

  it('Emits a transfer event with the right arguments when conducting an approved transfer', async function () {
    const transferAmount = 10000;
    await this.foreToken.transfer(
      this.recipientAddress,
      ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
    );
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
    );
    await expect(
      this.foreToken.transferFrom(
        this.recipientAddress,
        this.ownerAddress,
        ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Transfer')
      .withArgs(
        this.recipientAddress,
        this.ownerAddress,
        ethers.utils.parseUnits(transferAmount.toString(), this.decimals)
      );
  });

  it('Allows allowance to be increased and queried', async function () {
    const initialAmount = 100;
    const incrementAmount = 10000;
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(initialAmount.toString(), this.decimals)
    );
    const previousAllowance = await this.foreToken.allowance(
      this.recipientAddress,
      this.ownerAddress
    );
    await this.signerContract.increaseAllowance(
      this.ownerAddress,
      ethers.utils.parseUnits(incrementAmount.toString(), this.decimals)
    );
    const expectedAllowance = ethers.BigNumber.from(previousAllowance).add(
      ethers.BigNumber.from(
        ethers.utils.parseUnits(incrementAmount.toString(), this.decimals)
      )
    );
    expect(
      await this.foreToken.allowance(this.recipientAddress, this.ownerAddress)
    ).to.equal(expectedAllowance);
  });

  it('Emits approval event when alllowance is increased', async function () {
    const incrementAmount = 10000;
    await expect(
      this.signerContract.increaseAllowance(
        this.ownerAddress,
        ethers.utils.parseUnits(incrementAmount.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Approval')
      .withArgs(
        this.recipientAddress,
        this.ownerAddress,
        ethers.utils.parseUnits(incrementAmount.toString(), this.decimals)
      );
  });

  it('Allows allowance to be decreased and queried', async function () {
    const initialAmount = 100;
    const decrementAmount = 10;
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(initialAmount.toString(), this.decimals)
    );
    const previousAllowance = await this.foreToken.allowance(
      this.recipientAddress,
      this.ownerAddress
    );
    await this.signerContract.decreaseAllowance(
      this.ownerAddress,
      ethers.utils.parseUnits(decrementAmount.toString(), this.decimals)
    );
    const expectedAllowance = ethers.BigNumber.from(previousAllowance).sub(
      ethers.BigNumber.from(
        ethers.utils.parseUnits(decrementAmount.toString(), this.decimals)
      )
    );
    expect(
      await this.foreToken.allowance(this.recipientAddress, this.ownerAddress)
    ).to.equal(expectedAllowance);
  });

  it('Emits approval event when alllowance is decreased', async function () {
    const initialAmount = 100;
    const decrementAmount = 10;
    await this.signerContract.approve(
      this.ownerAddress,
      ethers.utils.parseUnits(initialAmount.toString(), this.decimals)
    );
    const expectedAllowance = ethers.BigNumber.from(
      ethers.utils.parseUnits(initialAmount.toString(), this.decimals)
    ).sub(
      ethers.BigNumber.from(
        ethers.utils.parseUnits(decrementAmount.toString(), this.decimals)
      )
    );
    await expect(
      this.signerContract.decreaseAllowance(
        this.ownerAddress,
        ethers.utils.parseUnits(decrementAmount.toString(), this.decimals)
      )
    )
      .to.emit(this.foreToken, 'Approval')
      .withArgs(this.recipientAddress, this.ownerAddress, expectedAllowance);
  });
});
