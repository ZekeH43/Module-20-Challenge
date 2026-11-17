"use strict";
/* Solidity 0.5.17 compile and local-chain behavioral tests, not a security audit. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");

const sourcePath = path.join(__dirname, "..", "Starter_Code", "Starter_Code", "joint_savings.sol");

function compile() {
  const source = fs.readFileSync(sourcePath, "utf8");
  assert.match(solc.version(), /^0\.5\.17/);
  const input = {
    language: "Solidity",
    sources: { "joint_savings.sol": { content: source } },
    settings: {
      optimizer: { enabled: false },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } }
    }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter(x => x.severity === "error");
  assert.equal(errors.length, 0, errors.map(e => e.formattedMessage).join("\n"));
  const artifact = output.contracts["joint_savings.sol"].JointSavings;
  assert.ok(artifact.abi && artifact.evm.bytecode.object);
  return artifact;
}

test("JointSavings compiles with Solidity 0.5.17", () => {
  const compiled = compile();
  assert.ok(compiled.evm.bytecode.object.length > 200);
});

test("owner-only setup, caller-restricted withdrawals, and balance accounting", async () => {
  const artifact = compile();
  const provider = new ethers.providers.Web3Provider(
    ganache.provider({
      logging: { quiet: true },
      chain: { chainId: 1337, hardfork: "istanbul" },
      wallet: { totalAccounts: 6, defaultBalance: 100 }
    })
  );
  const accounts = await provider.listAccounts();
  const [deployer, accountA, accountB, outsider] = accounts;
  const ownerSigner = provider.getSigner(deployer);
  const signerA = provider.getSigner(accountA);
  const signerB = provider.getSigner(accountB);
  const signerX = provider.getSigner(outsider);
  const factory = new ethers.ContractFactory(artifact.abi, "0x" + artifact.evm.bytecode.object, ownerSigner);
  const wallet = await factory.deploy();
  await wallet.deployed();

  assert.equal(await wallet.owner(), deployer);
  assert.equal(await wallet.accountsConfigured(), false);

  await assert.rejects(wallet.connect(signerX).setAccounts(accountA, accountB));
  await assert.rejects(wallet.setAccounts(ethers.constants.AddressZero, accountB));
  await assert.rejects(wallet.setAccounts(accountA, accountA));

  const setup = await (await wallet.setAccounts(accountA, accountB)).wait();
  assert.equal(setup.events.some(e => e.event === "AccountsConfigured"), true);
  assert.equal(await wallet.accountsConfigured(), true);
  await assert.rejects(wallet.setAccounts(accountA, outsider));

  await assert.rejects(wallet.connect(signerA).withdraw(1, accountA));

  const two = ethers.utils.parseEther("2");
  const one = ethers.utils.parseEther("1");
  const half = ethers.utils.parseEther("0.5");
  await assert.rejects(wallet.deposit({ value: 0 }));
  const deposit = await (await wallet.connect(signerX).deposit({ value: two })).wait();
  assert.equal(deposit.events.some(e => e.event === "Deposit"), true);
  assert.equal((await wallet.contractBalance()).toString(), two.toString());
  assert.equal((await provider.getBalance(wallet.address)).toString(), two.toString());

  await assert.rejects(wallet.connect(signerX).withdraw(one, accountA));
  await assert.rejects(wallet.connect(signerA).withdraw(one, accountB));
  await assert.rejects(wallet.connect(signerB).withdraw(two.add(1), accountB));
  await assert.rejects(wallet.connect(signerB).withdraw(0, accountB));

  const withdrawal = await (await wallet.connect(signerA).withdraw(one, accountA)).wait();
  assert.equal(withdrawal.events.some(e => e.event === "Withdrawal"), true);
  assert.equal(await wallet.lastToWithdraw(), accountA);
  assert.equal((await wallet.lastWithdrawAmount()).toString(), one.toString());
  assert.equal((await wallet.contractBalance()).toString(), one.toString());

  const fallbackDeposit = await (await signerX.sendTransaction({ to: wallet.address, value: half })).wait();
  assert.equal(fallbackDeposit.status, 1);
  assert.equal((await wallet.contractBalance()).toString(), one.add(half).toString());
  assert.equal((await provider.getBalance(wallet.address)).toString(), one.add(half).toString());
});
